# Supervised Land-Cover Classification of Munich Using Sentinel-2 and Random Forest

## Objective

Build a transparent four-class land-cover classification for Munich, Germany, using Sentinel-2 imagery and a Random Forest classifier. The classes are urban / built-up, bare / open land, water and vegetation.

## Study area

Munich, Germany.

## Datasets

- Sentinel-2 Level-2A surface reflectance, summer 2026
- Cloud Score+ for cloud-affected pixel masking
- Spectral bands: B2, B3, B4, B8, B11 and B12
- Derived indices: NDVI and MNDWI

## Workflow

1. Mask cloud-affected pixels with Cloud Score+.
2. Build a summer median Sentinel-2 composite.
3. Assemble the spectral bands, NDVI and MNDWI as predictors.
4. Label 100 points for each class (400 samples before masking).
5. Split the same labelled sample set randomly: 70% training and 30% testing.
6. Train a Random Forest model and classify the study area.
7. Assess the held-out test set with a confusion matrix.

![Methodology workflow](assets/images/Munich_Methodology_Workflow.png)

## Model

- Classifier: Random Forest
- Trees: 100
- Random seed: 42
- Class order: Urban / Built-up, Bare / Open Land, Water, Vegetation

## Validation and key results

The supplied test-set confusion matrix contains 130 samples after masking:

| Reference \ Predicted | Urban | Bare / Open Land | Water | Vegetation |
|---|---:|---:|---:|---:|
| Urban / Built-up | 30 | 4 | 0 | 0 |
| Bare / Open Land | 4 | 25 | 0 | 0 |
| Water | 0 | 0 | 34 | 2 |
| Vegetation | 0 | 1 | 0 | 30 |

- Overall Accuracy: **91.54%**
- Kappa: **0.887**

![Confusion matrix](assets/images/Munich_Confusion_Matrix.png)

## Interpretation

Urban and bare / open land show the largest reciprocal confusion. Water and vegetation are separated more reliably. The classification also shows salt-and-pepper noise, consistent with a pixel-based approach without post-classification smoothing.

## Limitations

The reported accuracy is a random holdout result from the same manually labelled sample set used to train the model. It is not a spatially independent validation result and should not be generalised beyond this test set. A production workflow would use geographically separate reference samples, ideally supported by independent imagery or field data.

## Tools

Google Earth Engine, Sentinel-2 Level-2A, Cloud Score+, JavaScript, Random Forest, Python, Matplotlib, NumPy and Pillow.

## Earth Engine source

[Open the Google Earth Engine script](https://code.earthengine.google.com/26b8e77387d61a9c6dbf9fd57404f309)

## Portfolio output

![RGB training samples and final classification](assets/images/Munich_LandCover_Portfolio.png)

The map imagery in the portfolio figure is cleanly cropped from the supplied Earth Engine screenshots. The RGB panel therefore retains its original training-point overlay; no missing map content has been fabricated.
