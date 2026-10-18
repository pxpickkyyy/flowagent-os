# FlowAgent OS — Custom Easing Curves & 120 BPM Beat Grid

## CustomEase Definitions (`lib/fx.js`)
- **`snapOut` (`0.16, 1, 0.3, 1`)**: Primary entrance curve for mask-revealed headlines, glass cards, and cursor travel. Fast launch with a long, cushioned settle.
- **`dramaticInOut` (`0.85, 0, 0.15, 1`)**: High-tension symmetric curve for specular light sweeps, OCR laser scans, and Z-axis zoom-through transitions.
- **`overshoot` (`0.34, 1.56, 0.64, 1`)**: Tactile spring overshoot (`4–6%`) used on hero card fan-out, button click rebounds, and the `SANCTIONS ENFORCEMENT ACTIVE` shield slam.
- **`whipPan` (`0.7, 0, 0.2, 1`)**: High-velocity exit curve for horizontal scene whip-pans.

## Beat Grid (`120 BPM` @ `60fps`)
- **1 Beat**: `0.50s` (`30` frames)
- **1 Bar (4 Beats)**: `2.00s` (`120` frames)
- **60s Master**: `120` beats (`30` bars, `3,600` frames)
- **30s Portrait Cutdown**: `60` beats (`15` bars, `1,800` frames)
