import SwiftUI
import WebKit

struct WorldTruthWebView: UIViewRepresentable {
    let route: WorldTruthRoute
    @ObservedObject var bridgeHub: WebBridgeHub
    var onLoadingChanged: ((Bool) -> Void)? = nil
    var onErrorChanged: ((String?) -> Void)? = nil

    func makeCoordinator() -> Coordinator {
        Coordinator(route: route, bridgeHub: bridgeHub, onLoadingChanged: onLoadingChanged, onErrorChanged: onErrorChanged)
    }

    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.userContentController.add(context.coordinator, name: AppConfig.webBridgeHandlerName)

        let bridgeBootstrapScript = """
        window.__WORLDTRUTH_IOS_APP__ = true;
        window.WorldTruthBridge = window.WorldTruthBridge || {};
        window.WorldTruthBridge.receiveNativeMessage = function(message) {
          try {
            var parsed = typeof message === 'string' ? JSON.parse(message) : message;
            window.dispatchEvent(new CustomEvent('worldtruth:native-message', { detail: parsed }));
          } catch (e) {
            console.error('WorldTruthBridge receiveNativeMessage failed', e);
          }
        };
        """

        let script = WKUserScript(source: bridgeBootstrapScript, injectionTime: .atDocumentStart, forMainFrameOnly: true)
        configuration.userContentController.addUserScript(script)
        configuration.applicationNameForUserAgent = AppConfig.iosUserAgentMarker

        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = context.coordinator
        context.coordinator.attach(webView)

        let request = URLRequest(url: route.url, cachePolicy: .reloadRevalidatingCacheData)
        webView.load(request)

        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {
        context.coordinator.bindRoute(route)
        context.coordinator.bindCallbacks(onLoadingChanged: onLoadingChanged, onErrorChanged: onErrorChanged)
    }

    final class Coordinator: NSObject, WKNavigationDelegate, WKScriptMessageHandler {
        private var route: WorldTruthRoute
        private let bridgeHub: WebBridgeHub
        private weak var webView: WKWebView?
        private var onLoadingChanged: ((Bool) -> Void)?
        private var onErrorChanged: ((String?) -> Void)?

        init(
            route: WorldTruthRoute,
            bridgeHub: WebBridgeHub,
            onLoadingChanged: ((Bool) -> Void)?,
            onErrorChanged: ((String?) -> Void)?
        ) {
            self.route = route
            self.bridgeHub = bridgeHub
            self.onLoadingChanged = onLoadingChanged
            self.onErrorChanged = onErrorChanged
            super.init()
        }

        func bindRoute(_ route: WorldTruthRoute) {
            guard self.route != route else { return }
            self.route = route
            webView?.load(URLRequest(url: route.url, cachePolicy: .reloadRevalidatingCacheData))
        }

        func bindCallbacks(onLoadingChanged: ((Bool) -> Void)?, onErrorChanged: ((String?) -> Void)?) {
            self.onLoadingChanged = onLoadingChanged
            self.onErrorChanged = onErrorChanged
        }

        func attach(_ webView: WKWebView) {
            self.webView = webView
            bridgeHub.bindSender { [weak webView] envelope in
                guard let webView else { return }
                guard let data = try? JSONEncoder().encode(envelope),
                      let rawJSONString = String(data: data, encoding: .utf8) else {
                    return
                }

                let escaped = rawJSONString
                    .replacingOccurrences(of: "\\", with: "\\\\")
                    .replacingOccurrences(of: "\"", with: "\\\"")
                    .replacingOccurrences(of: "\n", with: "")

                let script = "window.WorldTruthBridge && window.WorldTruthBridge.receiveNativeMessage(\"\(escaped)\");"
                webView.evaluateJavaScript(script)
            }
        }

        func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
            guard message.name == AppConfig.webBridgeHandlerName else { return }
            guard JSONSerialization.isValidJSONObject(message.body) else { return }
            guard let jsonData = try? JSONSerialization.data(withJSONObject: message.body),
                  let decoded = try? JSONDecoder().decode(WebBridgeEnvelope.self, from: jsonData) else {
                return
            }

            Task { @MainActor in
                bridgeHub.handleWebMessage(decoded)
            }
        }

        func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
            onLoadingChanged?(true)
            onErrorChanged?(nil)
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            onLoadingChanged?(false)
            onErrorChanged?(nil)
        }

        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
            onLoadingChanged?(false)
            onErrorChanged?(error.localizedDescription)
        }

        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
            onLoadingChanged?(false)
            onErrorChanged?(error.localizedDescription)
        }
    }
}
