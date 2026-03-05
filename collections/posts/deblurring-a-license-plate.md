---
title: "Unblurring a Hit-and-Run"
description: "I used math to recover a readable license plate from a motion-blurred photo of a hit-and-run car."
date: 2026-02-27
tags: ["python", "image-processing", "signal-processing"]
draft: false
---

**I took a blurred, unreadable photo of a hit-and-run car's license plate and made it legible using an algorithm built for deep-space telescopes.**

Someone in my area posted about a hit-and-run. They had a photo of the plate, but it was a smeared mess. You could not read a single letter.

I zoomed in. The blur was smooth and straight - not the random shake you'd expect from a shaky hand. It looked like pure linear motion. And if the blur follows a clear pattern, you can reverse it.

That reminded me of the ["Mr. Swirl Face" case](https://en.wikipedia.org/wiki/Christopher_Paul_Neil). A man hid his face in photos with a spiral filter. Police just reversed the filter. Same idea here: if the math is known, you can undo it.

<figure>
  <img src="../src/images/posts/deblur/blurred.png" alt="Motion-blurred license plate" />
  <figcaption>The original blurred image. The plate is unreadable. (Especially after my censoring)</figcaption>
</figure>

## How motion blur works

A moving object smears each point of light along its path. That smear is described by a convolution:

> blurred_image = sharp_image * blur_kernel

The **blur kernel** is a small image that maps how each dot of light gets spread. For straight-line motion blur, the kernel is just a line - at the angle of motion, with a length that matches the blur distance.

If you know the kernel, you can try to undo the blur. That's called **deconvolution**.

## The algorithm

I found the [**Richardson-Lucy algorithm**](https://en.wikipedia.org/wiki/Richardson%E2%80%93Lucy_deconvolution), first built for cleaning up telescope images. It guesses the sharp image, then refines that guess over and over:

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

Each pass sharpens the result. This isn't just a filter - it converges on the most likely sharp image given the blur. It's grounded in statistics.

## Building the kernel

The kernel needs to match the real blur. For linear motion, that means two values: the **angle** and the **length** in pixels.

I drew an anti-aliased line at the target angle, spreading each sample across nearby pixels with bilinear weights:

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

Anti-aliasing might not be critical, but jagged edges could hurt the end result.

<figure>
  <img src="../src/images/posts/deblur/seed_kernel.png" alt="Straight-line motion blur kernel" />
  <figcaption>The starting kernel at 151.5 degrees, 25 pixels long.</figcaption>
</figure>

## Finding the right values

This part was pure trial and error. I built a small tool with sliders for angle and length that showed a live preview of the deblurred result. I dragged sliders until letters started to show up.

I landed on angle 149.5, length 25. Characters began to emerge.

To check the angle, I looked at the **power spectrum** of the blurred image. Motion blur leaves dark bands in the frequency domain, at right angles to the blur direction. Those bands pointed to ~61.5 degrees - which means the blur runs at ~151.5. That small shift from 149.5 to 151.5 did help.

<figure>
  <img src="../src/images/posts/deblur/deblurred_seed_kernel.png" alt="Deblurred license plate with initial kernel" />
  <figcaption>The plate deblurred with the starting kernel.</figcaption>
</figure>

## Refining the kernel

A perfect straight line is an ideal. Real motion has acceleration and small wobbles. So I let the algorithm refine the kernel itself:

1. **Deblur** the image with the current kernel
2. **Re-estimate the kernel** from the sharp guess and the blurred image
3. Repeat

The kernel update uses the same math, but flipped - solve for the kernel given a known image instead of the other way around:

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

After 20 rounds, the kernel barely changed between passes. It was still a straight line - the blur really was linear - but the weight along it was no longer even. The camera was likely speeding up or slowing down during the shot.

<figure>
  <img src="../src/images/posts/deblur/refined_kernel.png" alt="Refined kernel after 20 rounds" />
  <figcaption>The refined kernel after 30 rounds. Still a line, but with uneven weight. The shift is subtle, but it matters.</figcaption>
</figure>

## The result

I could read the plate. Not perfectly - deconvolution can't create detail that was never captured. But enough to make out the characters, which was the whole point. I sent the plate number to the hit-and-run victim.

<figure>
  <img src="../src/images/posts/deblur/deblurred_refined_kernel.png" alt="Deblurred license plate" />
  <figcaption>The final result. The plate is now (mostly) legible.</figcaption>
</figure>

## How I used AI

I'm not a signal processing expert. I'm a software developer who saw a problem and thought "I bet that's reversible."

LLMs filled in the gaps. They walked me through the math behind Richardson-Lucy. They told me why my FFT convolution needed padding. They pointed me to kernel refinement when I asked how to push further.

The core ideas were mine - spotting the linear blur, tuning the values by eye, choosing to iterate. But AI turned what would have been weeks of research into an afternoon.

That's what AI-assisted development looks like: a person with a goal and instincts, using AI to fill in the parts they don't know by heart.

---

The full source code is available as a [GitHub Gist](https://gist.github.com/ttfm2200/9c719175f92209bf3b8d209c4748d099).
