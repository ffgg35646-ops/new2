# Aqar Al-Batin — Mobile release readiness

This is the isolated release branch: release/ios-app-store-prep. Do not merge it into main until the native preflight and TestFlight checks pass.

## What this branch prepares

- Adds the Capacitor iOS platform dependency while preserving the existing Android dependency.
- Prevents a release build from silently shipping the development LAN address. A release build must use a public HTTPS app URL.
- Generates/synchronizes an iOS project on a macOS/Xcode runner and sets the deployment target to iOS 13.
- Adds an iOS privacy-manifest template and records the actual iOS/Android platform for push tokens.
- Adds a manual GitHub Actions simulator build. It checks compilation only; it does not sign or submit an App Store binary.
- Leaves main, Vercel production settings, MongoDB, and the HyperPay code untouched.

## iOS support

The best practical legacy target for this Capacitor 6 line is iOS 13+. iOS 9 and 10 cannot be targeted for a new App Store submission under Apple's current upload rules. Capacitor 6 is now outside its normal support window, so the Xcode 26 simulator preflight is mandatory. Keep the iOS deployment target at 13 for this compatibility attempt; if the current native stack fails the Xcode 26 build or a required security check, use a maintained Capacitor release instead and accept its higher iOS minimum rather than ship an unverified build.

## Prepare a test build

Run the GitHub Actions workflow named “iOS Release Preflight” on this branch and provide the public HTTPS URL of the deployed Aqar Al-Batin app. It does not modify Vercel or the production branch.

For local Mac/Xcode preparation, use the release URL and run:

    CAPACITOR_BUILD_TARGET=release CAPACITOR_SERVER_URL=https://YOUR-PUBLIC-HTTPS-APP-URL npm run ios:prepare

Never build a Store release with a LAN address, localhost, or plain HTTP.

## Updates and rollback

This app currently uses Capacitor's hosted-server pattern. Web UI fixes deployed to the hosted app become available when users reopen/reload the app. If a web change is faulty, revert that change on GitHub so the normal deployment pipeline returns to the last known-good code. Users do not need to delete or reinstall the iOS app to roll back a web-layer change.

Changes to native plugins, iOS permissions/entitlements, native code, or native app settings require a new signed App Store/TestFlight build. A website rollback cannot undo native changes. Keep website-delivered changes within the app's approved purpose; do not use this path to introduce unrelated features.

## Review blockers to check before submitting

1. **Minimum functionality (Guideline 4.2):** Apple can reject a thin website wrapper. Test the actual iOS build, not just Safari. Make sure the real-estate search, office/client workflows, viewing requests, messaging, and available native interactions work from inside the app.
2. **Payments (Guidelines 3.1.1 / 3.1.3):** Pro unlocks digital in-app features and currently uses HyperPay. This branch intentionally does not change payment code. Before submission, confirm whether this office subscription qualifies for Apple's enterprise-services exception. Otherwise Apple may require In-App Purchase. Do not assume HyperPay is permitted merely because it works on the website.
3. **Account deletion and user-generated content:** Confirm that a user can request account deletion inside the app, reports can be sent, abusive users/content can be blocked or moderated as required, and public support contact information is available.
4. **Privacy:** Verify the published privacy policy URL, App Privacy answers, data retention/deletion disclosures, required-reason API declarations, and privacy manifests for all included SDKs. Do not state that data is not collected if accounts, messages, photos, phone/email, or property information are stored.
5. **Push notifications:** iOS push requires the Apple Push Notifications capability/key and backend delivery configured for iOS tokens. The code now records the actual platform; this alone does not create APNs credentials.
6. **Store assets and reviewer access:** Provide the required 1024×1024 app icon, device screenshots, accurate description/age rating, support and privacy URLs, working review credentials for individual and office flows, and instructions for reaching gated features.
7. **Real-device testing:** Install through TestFlight and test signup/login, payment return handling without making a real charge, photo upload, chat, push permissions, keyboard/RTL layout, network loss/recovery, and account deletion on the oldest supported iPhone that can be tested.

## Apple review

No code change can guarantee acceptance. If Apple cites Guideline 4.2 or 3.1.1, do not resubmit the same build unchanged; resolve the cited reason first. Review Apple's current App Review Guidelines and submission requirements before uploading.
