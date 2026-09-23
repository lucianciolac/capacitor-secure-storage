import Capacitor
import SimpleKeychain
import XCTest

@testable import SecureStoragePlugin

final class SecureStoragePluginTests: XCTestCase {
    private typealias ErrorCode = SecureStoragePlugin.ErrorCode
    private typealias MethodName = SecureStoragePlugin.MethodName
    private typealias OptionKey = SecureStoragePlugin.OptionKey

    private static let callbackId = "test"
    private static let unableToCreatePluginCallMessage =
        "Unable to create plugin call"

    private var testPrefix = ""
    private var keysToDelete: [(SimpleKeychain, String)] = []

    override func setUp() {
        super.setUp()
        testPrefix = "test-\(UUID().uuidString)-"
    }

    override func tearDown() {
        for (keychain, key) in keysToDelete {
            try? keychain.deleteItem(forKey: key)
        }
        super.tearDown()
    }

    func testStoresReadsAndListsValues() {
        let tokenKey = key("token")
        let emptyKey = key("empty")

        let tokenResult = set(tokenKey, value: "pässwörd 🔐 你好")
        XCTAssertTrue(tokenResult.isSuccessful)
        XCTAssertNil(tokenResult.result)
        XCTAssertTrue(set(emptyKey, value: "").isSuccessful)

        XCTAssertEqual("pässwörd 🔐 你好", get(tokenKey).value as? String)
        XCTAssertEqual("", get(emptyKey).value as? String)
        XCTAssertEqual(Set([tokenKey, emptyKey]), keys())
    }

    func testOverwritesRemovesAndClearsValues() {
        let firstKey = key("first")
        let secondKey = key("second")

        XCTAssertTrue(set(firstKey, value: "first").isSuccessful)
        XCTAssertTrue(set(firstKey, value: "updated").isSuccessful)
        XCTAssertTrue(set(secondKey, value: "value").isSuccessful)
        XCTAssertEqual("updated", get(firstKey).value as? String)

        let removeResult = remove(firstKey)
        XCTAssertTrue(removeResult.isSuccessful)
        XCTAssertNil(removeResult.result)
        XCTAssertEqual(ErrorCode.itemNotFound, get(firstKey).errorCode)

        let clearResult = clear()
        XCTAssertTrue(clearResult.isSuccessful)
        XCTAssertNil(clearResult.result)
        XCTAssertFalse(keys().contains(secondKey))
    }

    func testRejectsInvalidInputAndMissingItems() {
        for invalidKey in [nil, "", " \t\n"] {
            XCTAssertEqual(ErrorCode.invalidKey, get(invalidKey).errorCode)
            XCTAssertEqual(ErrorCode.invalidKey, remove(invalidKey).errorCode)
            XCTAssertEqual(
                ErrorCode.invalidKey,
                set(invalidKey, value: "value").errorCode
            )
        }

        XCTAssertEqual(
            ErrorCode.invalidValue,
            set(key("token"), value: nil).errorCode
        )

        let missingKey = key("missing")
        XCTAssertEqual(ErrorCode.itemNotFound, get(missingKey).errorCode)
        XCTAssertEqual(ErrorCode.itemNotFound, remove(missingKey).errorCode)
    }

    func testRejectsInvalidKeychainOptions() {
        let invalidOptionSets: [[String: Any]] = [
            [OptionKey.accessibility: "invalidAccessibility"],
            [OptionKey.accessibility: 1],
            [OptionKey.group: 1],
            [OptionKey.isSynchronizable: "true"],
        ]

        for invalidOptions in invalidOptionSets {
            XCTAssertEqual(
                ErrorCode.invalidValue,
                invoke(method: MethodName.keys, options: invalidOptions) { plugin, call in
                    plugin.keys(call)
                }.errorCode
            )
            XCTAssertEqual(
                ErrorCode.invalidValue,
                get(key("token"), options: invalidOptions).errorCode
            )
            XCTAssertEqual(
                ErrorCode.invalidValue,
                remove(key("token"), options: invalidOptions).errorCode
            )
            XCTAssertEqual(
                ErrorCode.invalidValue,
                clear(options: invalidOptions).errorCode
            )
            XCTAssertEqual(
                ErrorCode.invalidValue,
                set(key("token"), value: "value", options: invalidOptions).errorCode
            )
        }
    }

    func testListsKeysInRequestedSynchronizationScope() throws {
        let localKey = key("local")
        let synchronizedKey = key("synchronized")
        let localKeychain = keychain(synchronizable: false)
        let synchronizedKeychain = keychain(synchronizable: true)

        try localKeychain.set("local", forKey: localKey)
        try synchronizedKeychain.set("synchronized", forKey: synchronizedKey)
        track(localKey, in: localKeychain)
        track(synchronizedKey, in: synchronizedKeychain)

        XCTAssertEqual(Set([localKey]), keys(isSynchronizable: false))
        XCTAssertEqual(Set([synchronizedKey]), keys(isSynchronizable: true))
    }

    func testClearsOnlyTheRequestedSynchronizationScope() throws {
        let localKey = key("local")
        let synchronizedKey = key("synchronized")
        let localKeychain = keychain(synchronizable: false)
        let synchronizedKeychain = keychain(synchronizable: true)

        try localKeychain.set("local", forKey: localKey)
        try synchronizedKeychain.set("synchronized", forKey: synchronizedKey)
        track(localKey, in: localKeychain)
        track(synchronizedKey, in: synchronizedKeychain)

        XCTAssertTrue(clear(isSynchronizable: false).isSuccessful)
        XCTAssertFalse(try localKeychain.hasItem(forKey: localKey))
        XCTAssertTrue(try synchronizedKeychain.hasItem(forKey: synchronizedKey))

        XCTAssertTrue(clear(isSynchronizable: true).isSuccessful)
        XCTAssertFalse(try synchronizedKeychain.hasItem(forKey: synchronizedKey))
    }

    func testReportsStorageErrors() {
        let result = set(
            key("token"),
            value: "value",
            group: "invalid.access.group.\(UUID().uuidString)"
        )

        XCTAssertEqual(ErrorCode.storageError, result.errorCode)
    }

    private func set(
        _ key: String?,
        value: String?,
        group: String? = nil,
        options additionalOptions: [String: Any] = [:]
    ) -> PluginCallResult {
        var options = additionalOptions
        if let key {
            options[OptionKey.key] = key
        }
        if let value {
            options[OptionKey.value] = value
        }
        if let group {
            options[OptionKey.group] = group
        }

        let result = invoke(method: MethodName.set, options: options) { plugin, call in
            plugin.set(call)
        }
        if result.isSuccessful, let key {
            track(key, in: keychain(synchronizable: false))
        }
        return result
    }

    private func get(
        _ key: String?,
        options additionalOptions: [String: Any] = [:]
    ) -> PluginCallResult {
        invoke(method: MethodName.get, options: options(for: key, merging: additionalOptions)) { plugin, call in
            plugin.get(call)
        }
    }

    private func remove(
        _ key: String?,
        options additionalOptions: [String: Any] = [:]
    ) -> PluginCallResult {
        invoke(method: MethodName.remove, options: options(for: key, merging: additionalOptions)) { plugin, call in
            plugin.remove(call)
        }
    }

    private func keys(isSynchronizable: Bool? = nil) -> Set<String> {
        let result = invoke(
            method: MethodName.keys,
            options: synchronizationOptions(isSynchronizable)
        ) { plugin, call in
            plugin.keys(call)
        }
        return Set(
            (result.value as? [String] ?? []).filter {
                $0.hasPrefix(testPrefix)
            }
        )
    }

    private func clear(
        isSynchronizable: Bool? = nil,
        options additionalOptions: [String: Any] = [:]
    ) -> PluginCallResult {
        var options = additionalOptions
        if let isSynchronizable {
            options[OptionKey.isSynchronizable] = isSynchronizable
        }

        return invoke(
            method: MethodName.clear,
            options: options
        ) { plugin, call in
            plugin.clear(call)
        }
    }

    private func invoke(
        method: String,
        options: [String: Any] = [:],
        operation: (SecureStoragePlugin, CAPPluginCall) -> Void
    ) -> PluginCallResult {
        var result: [String: Any]?
        var errorCode: String?
        var resolved = false
        let call = CAPPluginCall(
            callbackId: Self.callbackId,
            methodName: method,
            options: options,
            success: { response, _ in
                resolved = true
                result = response?.data
            },
            error: { error in
                errorCode = error?.code
            }
        )
        guard let call else {
            XCTFail(Self.unableToCreatePluginCallMessage)
            return PluginCallResult(result: nil, errorCode: nil, resolved: false)
        }

        operation(SecureStoragePlugin(), call)
        return PluginCallResult(result: result, errorCode: errorCode, resolved: resolved)
    }

    private func options(
        for key: String?,
        merging additionalOptions: [String: Any] = [:]
    ) -> [String: Any] {
        var options = additionalOptions
        if let key {
            options[OptionKey.key] = key
        }
        return options
    }

    private func synchronizationOptions(_ isSynchronizable: Bool?) -> [String: Any] {
        guard let isSynchronizable else {
            return [:]
        }
        return [OptionKey.isSynchronizable: isSynchronizable]
    }

    private func keychain(synchronizable: Bool) -> SimpleKeychain {
        SimpleKeychain(
            service: SecureStoragePlugin.Storage.service,
            accessibility: .afterFirstUnlockThisDeviceOnly,
            synchronizable: synchronizable
        )
    }

    private func key(_ name: String) -> String {
        "\(testPrefix)\(name)"
    }

    private func track(_ key: String, in keychain: SimpleKeychain) {
        keysToDelete.append((keychain, key))
    }
}

private enum ResultKey {
    static let value = SecureStoragePlugin.OptionKey.value
}

private struct PluginCallResult {
    let result: [String: Any]?
    let errorCode: String?
    let resolved: Bool

    var isSuccessful: Bool {
        resolved && errorCode == nil
    }

    var value: Any? {
        result?[ResultKey.value]
    }
}
