---
title: "Deblurring a License Plate"
description: "How I used Richardson-Lucy deconvolution to recover a readable license plate from a motion-blurred hit-and-run photo."
date: 2026-02-27
tags: ["python", "image-processing", "signal-processing"]
draft: false
---

Someone local posted about a hit-and-run they were a victim of. They had managed to take a photo of the offender's license plate, but it was badly blurred - a smear of motion blur across the entire image. The plate was completely unreadable.

I looked closely at the plate hoping to see the characters pop out at me, but all I could see was the blur. I noticed that the blur looked remarkably uniform - not the chaos you usually see from camera shake. The blur appeared linear.

I felt that linear blur should be easy enough to reverse. That reminded me of the ["Mr. Swirl Face" case](https://en.wikipedia.org/wiki/Christopher_Paul_Neil) - a man who obscured his face in photos using a spiral distortion filter, and was eventually identified by law enforcement who simply reversed the distortion. If a transformation well-defined, it can be undone. Linear motion blur is about as well-defined as it gets.

I felt challenged to see if I could solve this.

<figure>
  <img src="../src/images/posts/deblur/blurred.png" alt="Motion-blurred license plate" />
  <figcaption>The original motion-blurred image. The plate is completely unreadable. (Especially after my censoring)</figcaption>
</figure>

## The math behind motion blur

When a camera captures a moving object (or the camera itself is moving), each point of light gets smeared along the direction of motion. The result is described by a convolution:

> blurred_image = sharp_image * blur_kernel

The **blur kernel** (also called a Point Spread Function, or PSF) is a small image that describes how each point of light gets smeared. For linear motion blur, it's literally just a line - at the angle of motion, with a length proportional to the blur distance.

If you know the kernel, you can attempt to reverse the process. This is called **deconvolution**.

## Richardson-Lucy deconvolution

Research led me to the [**Richardson-Lucy algorithm**](https://en.wikipedia.org/wiki/Richardson%E2%80%93Lucy_deconvolution), an iterative method originally developed for astronomical imaging. It works by repeatedly refining its estimate of the sharp image:

```python
for _ in range(iterations):
    # What would our estimate look like if blurred?
    conv = fftconvolve(estimate, psf, mode='same')
    # Where does the model under/over-predict?
    ratio = blurred_image / conv
    # Back-project the error and update
    correction = fftconvolve(ratio, psf_flipped, mode='same')
    estimate = estimate * correction
```

Each iteration sharpens the result a bit more. The key insight is that this converges toward the **maximum-likelihood estimate** under a Poisson noise model - it's not just heuristic sharpening, it's statistically grounded.

## Building the blur kernel

The first thing you need is a kernel that matches the actual blur. For linear motion blur, that means two parameters: the **angle** of the motion and the **length** in pixels.

I built the kernel by drawing an anti-aliased line at the given angle, using bilinear interpolation to distribute each sample's energy across neighboring pixels:

```python
def create_motion_kernel(length, angle):
    size = length * 2 + 1
    kernel = np.zeros((size, size), dtype=np.float64)
    center = size // 2

    angle_rad = np.radians(angle)
    cos_a, sin_a = np.cos(angle_rad), np.sin(angle_rad)

    # Oversample at 4x resolution for anti-aliasing
    for i in np.linspace(-length, length, length * 4 + 1):
        cx, cy = center + i * cos_a, center + i * sin_a
        # Distribute to 4 nearest pixels via bilinear interpolation
        x0, y0 = int(np.floor(cx)), int(np.floor(cy))
        fx, fy = cx - x0, cy - y0
        for (x, y, w) in [(x0, y0, (1-fx)*(1-fy)), (x0+1, y0, fx*(1-fy)),
                          (x0, y0+1, (1-fx)*fy), (x0+1, y0+1, fx*fy)]:
            if 0 <= x < size and 0 <= y < size:
                kernel[y, x] += w

    return kernel / kernel.sum()
```

The anti-aliasing may not be critical, but I felt that jaggead artifacts could result in a poorer end result.

<figure>
  <img src="../src/images/posts/deblur/seed_kernel.png" alt="Straight-line motion blur kernel" />
  <figcaption>The initial straight-line kernel at 151.5 degrees, 25 pixels long.</figcaption>
</figure>

## Finding the right blur parameters

The trial and error here was decidedly non-algorithmic. I built a basic tool with blur direction and angle sliders that provided a live view of the deconvolution results, which allowed me to get those values close enough.

Eventually, I settled on an angle of 149.5 with length 25. Suddenly the characters on the plate started to emerge.

To validate the angle, I wrote a quick script that analyzed the **power spectrum** of the blurred image. Motion blur creates characteristic dark bands in the frequency domain, perpendicular to the blur direction. Measuring the angle of those bands gave me ~61.5 - the perpendicular complement of the blur direction, which translates to ~151.5. That slight correction from 149.5 to 151.5 did produce a marginally better result.

<figure>
  <img src="../src/images/posts/deblur/deblurred_seed_kernel.png" alt="Deblurred license plate with initial kernel" />
  <figcaption>The license plate when deblurred with the initial kernel.</figcaption>
</figure>

## Refining the kernel

A straight line with uniform weights is an idealization. Real camera motion has acceleration, deceleration, and slight irregularities. To capture this, I implemented an alternating optimization that refines the kernel itself:

1. **Deconvolve** the image with the current kernel (standard RL)
2. **Re-estimate the kernel** using the sharp estimate and the blurred image
3. Repeat

The kernel re-estimation uses the same RL math, but with roles swapped - instead of solving for the image with a known kernel, you solve for the kernel with a known image:

```python
def estimate_kernel(blurred, sharp, kernel_size, current_kernel, iterations=10):
    kernel = current_kernel.copy()
    sharp_mirror = sharp[::-1, ::-1]

    for _ in range(iterations):
        conv = fftconvolve(sharp, kernel, mode='same') + 1e-12
        ratio = blurred / conv
        correction = fftconvolve(ratio, sharp_mirror, mode='same')

        # Extract kernel-sized region from center
        ch, cw = correction.shape[0] // 2, correction.shape[1] // 2
        kh, kw = kernel.shape
        kernel *= correction[ch-kh//2:ch-kh//2+kh, cw-kw//2:cw-kw//2+kw]

        # Physical constraints
        kernel = np.maximum(kernel, 0)
        kernel[kernel < 0.01 * kernel.max()] = 0  # compact support
        if kernel.sum() > 0:
            kernel /= kernel.sum()

    return kernel
```

After 20 rounds of alternation, the kernel delta (change per round) dropped from 0.038 to 0.005. The refined kernel was still essentially a straight line - confirming the blur really was linear motion - but with non-uniform weights along it. The camera was probably accelerating or decelerating during the exposure.

<figure>
  <img src="../src/images/posts/deblur/refined_kernel.png" alt="Refined kernel after 20 rounds" />
  <figcaption>The refined kernel after 30 rounds. Still a line, but with non-uniform weight distribution. The weight distribution is subtle, but it matters.</figcaption>
</figure>

## The result

After refinement, I could read the license plate. Not perfectly - deconvolution can recover information but it can't create detail that was never captured. But enough to make out the characters, which was the entire goal. I was able to provide the hit-and-run victim with the license plate of the offending car.

<figure>
  <img src="../src/images/posts/deblur/deblurred_refined_kernel.png" alt="Deblurred license plate" />
  <figcaption>The final deblurred result. The plate characters are now (sort of) legible.</figcaption>
</figure>

## How I used AI

I am not an expert in signal processing or deconvolution theory. I'm a software developer who saw an interesting problem and thought "I bet that can be reversed."

LLMs helped me bridge the knowledge gaps. They helped explain the math behind Richardson-Lucy. They helped me understand why my FFT-based convolution needed PSF padding. They suggested the mechanisms for iterative kernel refinement when I asked how to push the results further.

The core ideas - recognizing the blur was reversible, choosing the parameters by visual inspection, iterating on the approach - those were mine. But the implementation speed and the depth of the signal processing would have taken me significantly longer without AI assistance. It turned a multi-week research project into an afternoon.

I think this is a good example of what AI-assisted development looks like in practice: a human with domain intuition and a specific goal, using AI to fill in the technical details they don't have memorized.

---

The full source code is available as a [GitHub Gist](https://gist.github.com/ttfm2200/9c719175f92209bf3b8d209c4748d099).
