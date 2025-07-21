package com.degeder.yam;

import android.os.Bundle;
import android.view.View;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }

    @Override
    public void onStart() {
        super.onStart();
        // Disable the rubber-band over-scroll effect that causes the app UI to get stretched.
        WebView v = getBridge().getWebView();
        v.setOverScrollMode(View.OVER_SCROLL_NEVER);
    }
}