package com.harleytg.forum;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.net.Uri;
import android.net.http.SslError;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.CookieManager;
import android.webkit.SslErrorHandler;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import java.util.Locale;

public class MainActivity extends Activity {
    private static final String PRIMARY_HOST = "forum.harleytg.com";
    private static final String BACKUP_HOST = "harleysclan.freeflarum.com";
    private static final String PREFS = "hcf_app";
    private static final String PREF_FALLBACK_UNTIL = "fallback_until";
    private static final long PRIMARY_RETRY_COOLDOWN_MS = 6L * 60L * 60L * 1000L;
    private static final int FILE_CHOOSER_REQUEST = 1407;

    private WebView webView;
    private ProgressBar progressBar;
    private LinearLayout overlay;
    private TextView statusTitle;
    private TextView statusSubtitle;
    private LinearLayout actions;
    private Button retryButton;
    private Button alternateButton;
    private SharedPreferences prefs;
    private String activeHost;
    private boolean switchingHosts;
    private ValueCallback<Uri[]> filePathCallback;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(Color.rgb(13, 16, 20));
        getWindow().setNavigationBarColor(Color.rgb(13, 16, 20));

        prefs = getSharedPreferences(PREFS, MODE_PRIVATE);
        buildUi();
        configureWebView();
        configureButtons();

        if (savedInstanceState != null) {
            webView.restoreState(savedInstanceState);
            String current = webView.getUrl();
            activeHost = current != null && isForumUrl(Uri.parse(current))
                    ? Uri.parse(current).getHost()
                    : chooseInitialHost();
            hideOverlay();
            return;
        }

        activeHost = chooseInitialHost();
        Uri incoming = getIntent() == null ? null : getIntent().getData();
        String startUrl = isForumUrl(incoming)
                ? equivalentOnHost(incoming, activeHost)
                : home(activeHost);
        showChecking(activeHost);
        webView.loadUrl(startUrl);
    }

    private void buildUi() {
        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.rgb(13, 16, 20));

        webView = new WebView(this);
        root.addView(webView, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT));

        progressBar = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        progressBar.setMax(100);
        progressBar.setVisibility(View.GONE);
        FrameLayout.LayoutParams progressParams = new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, dp(3));
        progressParams.gravity = Gravity.TOP;
        root.addView(progressBar, progressParams);

        overlay = new LinearLayout(this);
        overlay.setOrientation(LinearLayout.VERTICAL);
        overlay.setGravity(Gravity.CENTER);
        overlay.setPadding(dp(28), dp(28), dp(28), dp(28));
        overlay.setBackgroundColor(Color.rgb(13, 16, 20));

        ImageView logo = new ImageView(this);
        logo.setImageResource(R.drawable.htg_icon);
        logo.setAdjustViewBounds(true);
        LinearLayout.LayoutParams logoParams = new LinearLayout.LayoutParams(dp(104), dp(104));
        overlay.addView(logo, logoParams);

        statusTitle = new TextView(this);
        statusTitle.setTextColor(Color.rgb(232, 248, 255));
        statusTitle.setTextSize(19);
        statusTitle.setGravity(Gravity.CENTER);
        statusTitle.setPadding(0, dp(18), 0, 0);
        overlay.addView(statusTitle, new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT,
                ViewGroup.LayoutParams.WRAP_CONTENT));

        statusSubtitle = new TextView(this);
        statusSubtitle.setTextColor(Color.rgb(174, 187, 194));
        statusSubtitle.setTextSize(13);
        statusSubtitle.setGravity(Gravity.CENTER);
        statusSubtitle.setPadding(0, dp(8), 0, 0);
        overlay.addView(statusSubtitle, new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT,
                ViewGroup.LayoutParams.WRAP_CONTENT));

        actions = new LinearLayout(this);
        actions.setOrientation(LinearLayout.HORIZONTAL);
        actions.setGravity(Gravity.CENTER);
        actions.setPadding(0, dp(18), 0, 0);
        actions.setVisibility(View.GONE);

        retryButton = new Button(this);
        retryButton.setText("Retry");
        actions.addView(retryButton);

        alternateButton = new Button(this);
        alternateButton.setText("Use backup");
        LinearLayout.LayoutParams altParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT,
                ViewGroup.LayoutParams.WRAP_CONTENT);
        altParams.leftMargin = dp(10);
        actions.addView(alternateButton, altParams);
        overlay.addView(actions);

        root.addView(overlay, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT));

        setContentView(root);
    }

    private void configureWebView() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setMediaPlaybackRequiresUserGesture(true);
        settings.setUserAgentString(settings.getUserAgentString() + " HCF-Android/0.1");

        CookieManager cookieManager = CookieManager.getInstance();
        cookieManager.setAcceptCookie(true);
        cookieManager.setAcceptThirdPartyCookies(webView, false);

        webView.setWebViewClient(new HcfWebViewClient());
        webView.setWebChromeClient(new HcfChromeClient());
        webView.setDownloadListener((url, userAgent, contentDisposition, mimeType, contentLength) ->
                openExternal(Uri.parse(url)));
    }

    private void configureButtons() {
        retryButton.setOnClickListener(v -> {
            Uri current = currentForumUri();
            showChecking(activeHost);
            webView.loadUrl(equivalentOnHost(current, activeHost));
        });

        alternateButton.setOnClickListener(v -> {
            String target = PRIMARY_HOST.equals(activeHost) ? BACKUP_HOST : PRIMARY_HOST;
            if (PRIMARY_HOST.equals(target)) {
                prefs.edit().remove(PREF_FALLBACK_UNTIL).apply();
            }
            switchHost(target, currentForumUri());
        });
    }

    private String chooseInitialHost() {
        long fallbackUntil = prefs.getLong(PREF_FALLBACK_UNTIL, 0L);
        return System.currentTimeMillis() < fallbackUntil ? BACKUP_HOST : PRIMARY_HOST;
    }

    private void failOverFromPrimary(Uri failedUri, String reason) {
        if (!PRIMARY_HOST.equals(activeHost) || switchingHosts) return;
        prefs.edit().putLong(
                PREF_FALLBACK_UNTIL,
                System.currentTimeMillis() + PRIMARY_RETRY_COOLDOWN_MS
        ).apply();
        statusTitle.setText("Primary forum unavailable");
        statusSubtitle.setText(reason + "\nSwitching to " + BACKUP_HOST);
        overlay.setVisibility(View.VISIBLE);
        actions.setVisibility(View.GONE);
        switchHost(BACKUP_HOST, failedUri);
    }

    private void switchHost(String targetHost, Uri source) {
        switchingHosts = true;
        activeHost = targetHost;
        showChecking(targetHost);
        webView.stopLoading();
        webView.loadUrl(equivalentOnHost(source, targetHost));
    }

    private void showChecking(String host) {
        statusTitle.setText("Checking forum connection…");
        statusSubtitle.setText(host);
        actions.setVisibility(View.GONE);
        overlay.setVisibility(View.VISIBLE);
    }

    private void showUnavailable(String detail) {
        switchingHosts = false;
        statusTitle.setText("Forum unavailable");
        statusSubtitle.setText(detail);
        alternateButton.setText(PRIMARY_HOST.equals(activeHost) ? "Use backup" : "Try primary");
        actions.setVisibility(View.VISIBLE);
        overlay.setVisibility(View.VISIBLE);
        progressBar.setVisibility(View.GONE);
    }

    private void hideOverlay() {
        switchingHosts = false;
        overlay.setVisibility(View.GONE);
    }

    private Uri currentForumUri() {
        String current = webView.getUrl();
        if (current != null) {
            Uri uri = Uri.parse(current);
            if (isForumUrl(uri)) return uri;
        }
        return Uri.parse(home(activeHost));
    }

    private static boolean isForumUrl(Uri uri) {
        if (uri == null || !"https".equalsIgnoreCase(uri.getScheme())) return false;
        String host = uri.getHost();
        if (host == null) return false;
        host = host.toLowerCase(Locale.US);
        return PRIMARY_HOST.equals(host) || BACKUP_HOST.equals(host);
    }

    private static String equivalentOnHost(Uri source, String targetHost) {
        String path = source.getEncodedPath();
        if (path == null || path.isEmpty()) path = "/";
        Uri.Builder builder = new Uri.Builder()
                .scheme("https")
                .authority(targetHost)
                .encodedPath(path);
        if (source.getEncodedQuery() != null) builder.encodedQuery(source.getEncodedQuery());
        if (source.getEncodedFragment() != null) builder.encodedFragment(source.getEncodedFragment());
        return builder.build().toString();
    }

    private static String home(String host) {
        return "https://" + host + "/";
    }

    private void openExternal(Uri uri) {
        try {
            startActivity(new Intent(Intent.ACTION_VIEW, uri));
        } catch (ActivityNotFoundException e) {
            Toast.makeText(this, "No app can open this link.", Toast.LENGTH_SHORT).show();
        }
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }

    @Override
    public void onBackPressed() {
        if (overlay.getVisibility() == View.VISIBLE && webView.getUrl() != null) {
            hideOverlay();
            return;
        }
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        webView.saveState(outState);
        super.onSaveInstanceState(outState);
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != FILE_CHOOSER_REQUEST || filePathCallback == null) return;
        Uri[] result = null;
        if (resultCode == RESULT_OK && data != null) {
            if (data.getClipData() != null) {
                int count = data.getClipData().getItemCount();
                result = new Uri[count];
                for (int i = 0; i < count; i++) {
                    result[i] = data.getClipData().getItemAt(i).getUri();
                }
            } else if (data.getData() != null) {
                result = new Uri[]{data.getData()};
            }
        }
        filePathCallback.onReceiveValue(result);
        filePathCallback = null;
    }

    private final class HcfChromeClient extends WebChromeClient {
        @Override
        public void onProgressChanged(WebView view, int newProgress) {
            progressBar.setProgress(newProgress);
            progressBar.setVisibility(newProgress >= 100 ? View.GONE : View.VISIBLE);
        }

        @Override
        public boolean onShowFileChooser(
                WebView webView,
                ValueCallback<Uri[]> callback,
                FileChooserParams fileChooserParams
        ) {
            if (filePathCallback != null) filePathCallback.onReceiveValue(null);
            filePathCallback = callback;
            try {
                startActivityForResult(fileChooserParams.createIntent(), FILE_CHOOSER_REQUEST);
                return true;
            } catch (ActivityNotFoundException e) {
                filePathCallback = null;
                Toast.makeText(MainActivity.this, "No file picker is available.", Toast.LENGTH_SHORT).show();
                return false;
            }
        }
    }

    private final class HcfWebViewClient extends WebViewClient {
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            Uri uri = request.getUrl();
            if (isForumUrl(uri)) {
                if (!activeHost.equalsIgnoreCase(uri.getHost())) {
                    view.loadUrl(equivalentOnHost(uri, activeHost));
                    return true;
                }
                return false;
            }

            String scheme = uri.getScheme();
            if ("http".equalsIgnoreCase(scheme)
                    || "https".equalsIgnoreCase(scheme)
                    || "mailto".equalsIgnoreCase(scheme)
                    || "tel".equalsIgnoreCase(scheme)) {
                openExternal(uri);
            }
            return true;
        }

        @Override
        public void onPageStarted(WebView view, String url, Bitmap favicon) {
            Uri uri = Uri.parse(url);
            if (isForumUrl(uri)) statusSubtitle.setText(uri.getHost());
        }

        @Override
        public void onPageFinished(WebView view, String url) {
            Uri uri = Uri.parse(url);
            if (isForumUrl(uri) && activeHost.equalsIgnoreCase(uri.getHost())) {
                hideOverlay();
            }
        }

        @Override
        public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
            if (!request.isForMainFrame()) return;
            Uri failed = request.getUrl();
            String detail = "Connection error " + error.getErrorCode();
            if (PRIMARY_HOST.equalsIgnoreCase(failed.getHost())) {
                failOverFromPrimary(failed, detail);
            } else {
                showUnavailable(detail + "\n" + BACKUP_HOST);
            }
        }

        @Override
        public void onReceivedHttpError(WebView view, WebResourceRequest request, WebResourceResponse errorResponse) {
            if (!request.isForMainFrame()) return;
            int status = errorResponse.getStatusCode();
            if (status < 500 || status > 599) return;
            Uri failed = request.getUrl();
            if (PRIMARY_HOST.equalsIgnoreCase(failed.getHost())) {
                failOverFromPrimary(failed, "Server returned HTTP " + status);
            } else {
                showUnavailable("Backup server returned HTTP " + status);
            }
        }

        @Override
        public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error) {
            handler.cancel();
            Uri failed = Uri.parse(error.getUrl());
            if (PRIMARY_HOST.equalsIgnoreCase(failed.getHost())) {
                failOverFromPrimary(failed, "Secure connection failed");
            } else if (BACKUP_HOST.equalsIgnoreCase(failed.getHost())) {
                showUnavailable("Backup secure connection failed");
            }
        }
    }
}
