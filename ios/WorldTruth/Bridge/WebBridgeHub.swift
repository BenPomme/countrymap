import Foundation

@MainActor
final class WebBridgeHub: ObservableObject {
    @Published var lastWebMessage: WebBridgeEnvelope?

    private var sender: ((NativeBridgeEnvelope) -> Void)?

    func bindSender(_ sender: @escaping (NativeBridgeEnvelope) -> Void) {
        self.sender = sender
    }

    func handleWebMessage(_ message: WebBridgeEnvelope) {
        lastWebMessage = message
    }

    func sendToWeb(_ message: NativeBridgeEnvelope) {
        sender?(message)
    }
}
