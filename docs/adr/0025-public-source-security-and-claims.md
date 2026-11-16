# ADR 0025 — A supported SDK and verifiable public claims

Date: 2026-11-16. Status: proposed in the public-source completion PR.

## Context

The source-release review found vulnerable dependency paths on Expo SDK 56,
landing figures that did not match their linked evidence, and privacy wording
that implied both an existing legal engagement and no processor access.
The public build remains landing-only; member launch is separately gated.

## Decisions

1. Upgrade incrementally through the supported Expo SDK 57 and 58 dependency
   sets. Keep the SDK 58 aligned React 19.3 / React Native 0.88.1 versions;
   do not force incompatible transitive overrides or accept the audit's
   proposed SDK downgrade. Record the residual audit findings rather than
   promise a vulnerability-free dependency graph.
2. Preserve the existing interaction and safety assertions. Adapt refs to the
   new `ComponentRef` types and await the router's asynchronous test API.
   Explicitly install the matching test renderer and the React Native asset
   registry compatibility package still imported by react-native-svg on web.
   The registry delegates to React Native's public AssetRegistry. Move splash
   settings into the supported plugin and use the existing square adaptive
   icon for the Android monochrome mask. Native device rendering is unverified.
3. Align the landing page with the references already linked from the vision:
   Wang et al. (2025), reference 35, estimates 52.55 million AF/atrial-flutter
   cases in 2021; Zhang et al. (2024), reference 38, reports pooled anxiety
   13% and depression 22%; Ghezzi et al. (2023), reference 39, reports pooled
   PTSD 12.43% among ICD recipients. Use approximate plain-language fractions
   and say that measures and estimates varied. Remove the unsubstantiated
   hospital-share and comparative PTSD statements. These are population
   estimates, not predictions about a reader or evidence of product efficacy.
4. State that member policies are being prepared for legal review; do not
   invent an engagement or completed review. Replace absolute no-sharing
   language with the actual planned database/Sheet/email processor path,
   subject to reviewed written terms, no independent reuse and disclosure
   before reopening the list. The current form stays off. Do not declare
   that interest in this project cannot support health inferences; counsel
   must confirm classification and safeguards before the list opens.
5. Prepare version 0.1.1 as a public-source prototype. Preserve v0.1.0 and the
   private development archive. No launch gate, processor contract, legal
   opinion, clinical validation or native release is created by this change.

## Verification

The existing landing and privacy assertions were updated to the corrected
claims and shown failing against the old copy before implementation. Run
lint, types, all application tests, landing-mode tests, the production export,
Expo doctor, the dependency and credential scans, and the repository guards.
GitHub CI must also prove the real database and Docker image. Record manual
browser and screen-reader evidence and its limits in PUBLIC_SOURCE_READINESS.

The contributor DCO attestation and repository visibility/control changes
remain separate, explicit publication steps. Do not mark them complete from
code tests.

## Consequences

This is a major framework migration with native risk despite unchanged feature
scope. Source can be reviewed as a prototype; native distribution needs device
checks and all member launch gates. No consent, database policy, privacy floor,
tracking restriction or organizational scope is relaxed.

## Sources

- [Expo upgrade guidance](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/)
- [Expo SDK 57](https://expo.dev/changelog/sdk-57)
- [Expo SDK 58](https://expo.dev/changelog/sdk-58)
- [Wang et al., 2025](https://doi.org/10.3389/fcvm.2025.1540750)
- [Zhang et al., 2024](https://doi.org/10.5498/wjp.v14.i1.179)
- [Ghezzi et al., 2023](https://doi.org/10.1093/europace/euad130)
