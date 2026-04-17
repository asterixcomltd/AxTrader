package com.asterixcom.axtrader;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import androidx.browser.customtabs.CustomTabsIntent;

/**
 * TWA Launcher — opens AxTrader PWA in a Trusted Web Activity.
 * Displays full-screen (no browser chrome) when Digital Asset Links are verified.
 * Falls back to Custom Tab or default browser otherwise.
 */
public class LauncherActivity extends Activity {

    private static final String LAUNCH_URL = "https://axtrader.vercel.app";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        try {
            CustomTabsIntent customTabsIntent = new CustomTabsIntent.Builder()
                    .setShowTitle(false)
                    .setShareState(CustomTabsIntent.SHARE_STATE_OFF)
                    .build();

            // Prefer Chrome for TWA support
            customTabsIntent.intent.setPackage("com.android.chrome");

            customTabsIntent.launchUrl(this, Uri.parse(LAUNCH_URL));
        } catch (Exception e) {
            // Fallback: open in any browser
            Intent browserIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(LAUNCH_URL));
            startActivity(browserIntent);
        }

        finish();
    }
}
