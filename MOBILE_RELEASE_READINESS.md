# Aqar Al-Batin — iOS release readiness

## Status

- Work is isolated on `release/ios-app-store-prep`; `main` and the finished web product are not changed by this release branch.
- The previous GitHub Actions run `#63` passed the source build, TypeScript check, iOS preparation, and unsigned iOS simulator build. That is not a signed device IPA.
- The release workflow now has a separate optional job to create an App Store-signed IPA. No signed IPA exists until Apple signing credentials are configured and export succeeds.
- The app is not yet approved or verified as ready for App Store submission. A real iPhone/TestFlight run and the policy checks below remain required.

## Keep the iOS app separate from the main website

Release builds use only the `IOS_APP_URL` setting. They no longer fall back to `VITE_PUBLIC_APP_URL`, a generic public website URL, or the known main-branch URL. The workflow rejects the main-branch URL so the installed app cannot silently follow the website product.

The app currently depends on TanStack Start server functions and authenticated backend behavior. For that reason, the iOS build uses a dedicated hosted endpoint rather than treating the frontend build as a self-contained static bundle. That endpoint must be separate from the public website and must serve the Aqar Al-Batin app experience.

Once the dedicated endpoint is connected to automatic deployment from this iOS release branch, UI changes deployed there become available when the installed app opens/reloads. Users do not need to reinstall the IPA or upload a new IPA to the App Store for those hosted UI changes. This automatic behavior is **not yet verified active**: the app-only endpoint must first exist and be wired to the release branch. GitHub Actions cannot host the TanStack server functions by itself.

Changes to native code, Capacitor plugins, permissions, entitlements, signing, or app capabilities still require a new signed IPA and Apple's normal distribution/review process. Remote UI/code changes must stay within the app's approved purpose; live updates are not a way to bypass App Store review for material changes.

## Dedicated app endpoint

Set the GitHub Actions repository variable `IOS_APP_URL` to the public HTTPS endpoint used only by the iOS app, or supply the same value to the workflow's `ios_app_url` input. Do not point it to the main website. The workflow checks reachability, verifies that the endpoint serves Aqar Al-Batin, and stops instead of silently choosing the wrong URL.

For a local macOS/Xcode preparation:

```sh
CAPACITOR_BUILD_TARGET=release IOS_APP_URL=https://YOUR-DEDICATED-IOS-APP-URL npm run ios:prepare
```

## Export a signed IPA

Configure these GitHub Actions repository secrets. Do not commit certificates, passwords, or provisioning profiles to Git.

- `APPLE_TEAM_ID`: Apple Developer Team ID.
- `IOS_DISTRIBUTION_CERTIFICATE_P12_BASE64`: base64 encoding of the Apple Distribution .p12 certificate.
- `IOS_DISTRIBUTION_CERTIFICATE_PASSWORD`: password protecting that P12.
- `IOS_APP_STORE_PROFILE_BASE64`: base64 encoding of the App Store provisioning profile for `cloud.baytialkhass.app`.

Then manually dispatch the workflow **iOS Release Validation and IPA**, set `build_signed_ipa=true`, and let the signing/export job run. If it succeeds, download the `aqar-albatin-signed-ipa` artifact from that GitHub Actions run. It is currently configured to export for App Store Connect; it is not automatically uploaded to App Store Connect.

## Remaining App Store checks

1. **Minimum functionality (Guideline 4.2):** test the real app, not Safari alone. Apple may reject an app that appears to be only a website wrapper. Verify property browsing, individual/office workflows, requests, messaging, and native interactions inside the app.
2. **Payments (Guidelines 3.1.1 / 3.1.3):** Pro currently uses HyperPay for premium digital features. Confirm that the exact office/business subscription qualifies for an applicable exception; otherwise StoreKit/In-App Purchase and server-side receipt validation may be necessary. Do not assume web payment approval implies App Store approval.
3. **Apple signing and identifier:** confirm `cloud.baytialkhass.app` is registered to the correct Developer Team and that the certificate/profile match this bundle ID.
4. **Push notifications:** configure the Apple Push Notifications capability/key and backend delivery for iOS, then test on a physical device.
5. **Privacy and support:** verify the public privacy policy, terms and support links, monitored support contact, privacy declarations/manifests, required-reason API declarations, retention/deletion behavior, and user-generated-content moderation.
6. **Store listing and review:** prepare the 1024×1024 icon, screenshots, description, age rating, reviewer credentials, and instructions for gated office/client features.
7. **Physical device/TestFlight:** test login/signup, payment return without a real charge, photo upload, chat, push permissions, Arabic RTL and keyboard layouts, network loss/recovery, and account deletion.
8. **Native baseline:** this project uses Capacitor 6, which is outside its normal support window. The Xcode 26 simulator build passed previously, but re-check current dependencies and compatibility before release.

A successful simulator build or signed IPA export does not guarantee App Store approval. Do not mark this app ready for submission until the dedicated endpoint, policy questions, signing, and physical-device/TestFlight checks are resolved.
