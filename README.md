# [XForm](https://gabrielerandazzo.github.io/XForm/)  
XForm is a web-based tool for visualizing elementary and composite signals. 
It parses mathematical expressions using functions like rect, tri, sinc and other standard function, then generates and plots the waveform with Chart.js.

[Xform](https://gabrielerandazzo.github.io/XForm/)

![xform](images/screenshot.png)

## Why?

This project was created as a **personal study tool** for understanding and visualizing concepts from *Signal Theory*.  
When learning about signals, it can be challenging to correctly translate between a **mathematical expression** and its **graphical representation**.  
By building this tool, I wanted to create an interactive way to verify my intuition: writing a formula and instantly seeing the resulting waveform, or checking whether a plotted shape matches its analytical form.

## Documentation
Rectangular, triangular, and other standard functions are fundamental building blocks in signal processing, communication systems, and Fourier analysis.
They are widely used to model pulses, filters, modulation envelopes, and mathematically idealized signals.

### The signal type:


- **Rectangular function:** `rect(t/w)`
The rectangular function equals 1 when the absolute value of t is less than or equal to half of the width w, and 0 otherwise.
It represents an ideal pulse with perfectly sharp edges.
In the frequency domain, it corresponds to a sinc-shaped spectrum, and is essential for modeling ideal filters and time-limited signals.

- **Triangular function:** `tri(t/w)`
The triangular function is defined as 1 minus |t|/w when |t| ≤ w, and 0 otherwise.
It can be viewed as the convolution of two rectangular pulses.
Compared to the rectangular pulse, it produces smoother transitions and a squared-sinc frequency response in the frequency domain.

- **Sinc function:** `sinc(t)`
The sinc function is defined as sin(pi * t) / (pi * t), with a value of 1 at t = 0.
It is the Fourier transform of the rectangular pulse.
Sinc is fundamental in sampling theory, ideal reconstruction, low-pass filtering, and bandwidth-limited signal modeling.

- **Gaussian function:** `gauss(t)`
The Gaussian function is defined as exp(−t²).
It models smooth, naturally decaying signals.
Its Fourier transform is also a Gaussian, making it important in modulation, probabilistic models, and low-distortion filtering.

- **Exponential decay:** `exp(t)`
This function returns exp(−|t|), generating a symmetric exponential decay around 0.
It models damping, transient responses, and envelope behavior in many physical and electronic systems.

- **Unit step:** `step(t)`
The step function equals 0 for t < 0, 1 for t > 0, and 0.5 at t = 0.
It describes sudden transitions, system activation, switching behavior, and piecewise-defined signals.

- **Approximate delta:** `delta(t)`
The delta(t) function is implemented as a narrow rectangular pulse with width epsilon and height 1/(2*epsilon).
This approximates the Dirac delta, a signal with unit area and zero width.
It is used to model ideal impulses, instantaneous events, and sampling operations.

- **Sin, cos, tan:** `sin(t)`, `cos(t)`, `tan(t)`
Classical trigonometric functions.
They are used to model oscillations, periodic signals, Fourier series components, and modulation carriers.

By combining and scaling these elementary signals with different amplitudes, centers, and widths, this tool allows the visualization of **composite spectral shapes**.

## Contributing

Contributions are welcome. If you’d like to improve XForm, fix a bug, or add a new feature, feel free to open an issue or submit a pull request.

## License

**MIT License**