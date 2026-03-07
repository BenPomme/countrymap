import Foundation

struct WebBridgeEnvelope: Codable {
    let type: String
    let payload: [String: BridgeValue]
}

enum BridgeValue: Codable {
    case string(String)
    case number(Double)
    case bool(Bool)
    case object([String: BridgeValue])
    case array([BridgeValue])
    case null

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()

        if container.decodeNil() {
            self = .null
        } else if let boolValue = try? container.decode(Bool.self) {
            self = .bool(boolValue)
        } else if let numberValue = try? container.decode(Double.self) {
            self = .number(numberValue)
        } else if let stringValue = try? container.decode(String.self) {
            self = .string(stringValue)
        } else if let objectValue = try? container.decode([String: BridgeValue].self) {
            self = .object(objectValue)
        } else if let arrayValue = try? container.decode([BridgeValue].self) {
            self = .array(arrayValue)
        } else {
            throw DecodingError.typeMismatch(
                BridgeValue.self,
                DecodingError.Context(codingPath: decoder.codingPath, debugDescription: "Unsupported bridge value")
            )
        }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch self {
        case .string(let value):
            try container.encode(value)
        case .number(let value):
            try container.encode(value)
        case .bool(let value):
            try container.encode(value)
        case .object(let value):
            try container.encode(value)
        case .array(let value):
            try container.encode(value)
        case .null:
            try container.encodeNil()
        }
    }

    var stringValue: String? {
        if case let .string(value) = self { return value }
        return nil
    }

    var boolValue: Bool? {
        if case let .bool(value) = self { return value }
        return nil
    }

    var doubleValue: Double? {
        if case let .number(value) = self { return value }
        return nil
    }

    var objectValue: [String: BridgeValue]? {
        if case let .object(value) = self { return value }
        return nil
    }
}

struct NativeBridgeEnvelope: Codable {
    let type: String
    let payload: [String: BridgeValue]
}
