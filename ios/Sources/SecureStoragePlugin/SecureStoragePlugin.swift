import Capacitor
import Foundation
import SimpleKeychain

/**
 * Please read the Capacitor iOS Plugin Development Guide
 * here: https://capacitor.ionicframework.com/docs/plugins/ios
 */
@objc(SecureStoragePlugin)
public final class SecureStoragePlugin: CAPPlugin, CAPBridgedPlugin {
    enum ErrorCode {
        static let invalidKey = "INVALID_KEY"
        static let invalidValue = "INVALID_VALUE"
        static let itemNotFound = "ITEM_NOT_FOUND"
        static let storageError = "STORAGE_ERROR"
    }

    enum MethodName {
        static let set = "set"
        static let get = "get"
        static let keys = "keys"
        static let remove = "remove"
        static let clear = "clear"
    }

    enum OptionKey {
        static let key = "key"
        static let value = "value"
        static let group = "group"
        static let accessibility = "accessibility"
        static let isSynchronizable = "isSynchronizable"
    }

    enum Storage {
        static let service = "cap_sec"
    }

    private enum ErrorMessage {
        static let invalidKey = "Key must be a non-empty string"
        static let invalidValue = "Value must be a string"
        static let invalidAccessibility = "Accessibility must be a valid Keychain accessibility option"
        static let invalidGroup = "Group must be a string"
        static let invalidSynchronizable = "isSynchronizable must be a boolean"
        static let itemNotFound = "Item with given key does not exist"
        static let storageWrite = "Unable to write to secure storage"
        static let storageRead = "Unable to read from secure storage"
        static let storageKeys = "Unable to list secure storage keys"
        static let storageRemove = "Unable to remove item from secure storage"
        static let storageClear = "Unable to clear secure storage"
    }

    private struct KeychainOptions {
        let accessibility: Accessibility
        let group: String?
        let isSynchronizable: Bool
    }

    public let identifier = "SecureStoragePlugin"
    public let jsName = "SecureStoragePlugin"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: MethodName.set, returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: MethodName.get, returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: MethodName.keys, returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: MethodName.remove, returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: MethodName.clear, returnType: CAPPluginReturnPromise),
    ]

    @objc
    func set(_ call: CAPPluginCall) {
        guard let key = self.requireKey(call) else {
            return
        }

        guard let value = call.getString(OptionKey.value) else {
            return call.reject(ErrorMessage.invalidValue, ErrorCode.invalidValue)
        }

        guard let keychainOptions = self.requireKeychainOptions(call) else {
            return
        }

        let simpleKeychain = self.makeKeychain(keychainOptions)

        do {
            try simpleKeychain.set(value, forKey: key)
            call.resolve()
        } catch {
            call.reject(ErrorMessage.storageWrite, ErrorCode.storageError, error)
        }
    }

    @objc
    func get(_ call: CAPPluginCall) {
        guard let key = self.requireKey(call) else {
            return
        }

        guard let keychainOptions = self.requireKeychainOptions(call) else {
            return
        }

        let simpleKeychain = self.makeKeychain(keychainOptions)

        do {
            guard try self.requireExistingItem(key, in: simpleKeychain, call) else {
                return
            }
            let value = try simpleKeychain.string(forKey: key)
            call.resolve([OptionKey.value: value])
        } catch {
            call.reject(ErrorMessage.storageRead, ErrorCode.storageError, error)
        }
    }

    @objc
    func keys(_ call: CAPPluginCall) {
        guard let keychainOptions = self.requireKeychainOptions(call) else {
            return
        }

        let simpleKeychain = self.makeKeychain(keychainOptions)

        do {
            let keys = try simpleKeychain.keys()
            call.resolve([
                OptionKey.value: Array(keys),
            ])
        } catch {
            call.reject(ErrorMessage.storageKeys, ErrorCode.storageError, error)
        }
    }

    @objc
    func remove(_ call: CAPPluginCall) {
        guard let key = self.requireKey(call) else {
            return
        }

        guard let keychainOptions = self.requireKeychainOptions(call) else {
            return
        }

        let simpleKeychain = self.makeKeychain(keychainOptions)

        do {
            guard try self.requireExistingItem(key, in: simpleKeychain, call) else {
                return
            }
            try simpleKeychain.deleteItem(forKey: key)
            call.resolve()
        } catch {
            call.reject(ErrorMessage.storageRemove, ErrorCode.storageError, error)
        }
    }

    @objc
    func clear(_ call: CAPPluginCall) {
        guard let keychainOptions = self.requireKeychainOptions(call) else {
            return
        }

        let simpleKeychain = self.makeKeychain(keychainOptions)

        do {
            try simpleKeychain.deleteAll()
            call.resolve()
        } catch {
            call.reject(ErrorMessage.storageClear, ErrorCode.storageError, error)
        }
    }

    private func makeKeychain(_ options: KeychainOptions) -> SimpleKeychain {
        return SimpleKeychain(
            service: Storage.service,
            accessGroup: options.group,
            accessibility: options.accessibility,
            synchronizable: options.isSynchronizable
        )
    }

    private func requireKeychainOptions(_ call: CAPPluginCall) -> KeychainOptions? {
        guard let accessibility = self.requireAccessibility(call) else {
            return nil
        }
        let group = call.getString(OptionKey.group)
        guard group != nil || call.options[OptionKey.group] == nil else {
            call.reject(ErrorMessage.invalidGroup, ErrorCode.invalidValue)
            return nil
        }
        guard let isSynchronizable = self.requireSynchronizable(call) else {
            return nil
        }

        return KeychainOptions(
            accessibility: accessibility,
            group: group,
            isSynchronizable: isSynchronizable
        )
    }

    private func requireSynchronizable(_ call: CAPPluginCall) -> Bool? {
        guard let rawValue = call.options[OptionKey.isSynchronizable] else {
            return false
        }
        guard let value = rawValue as? Bool else {
            call.reject(ErrorMessage.invalidSynchronizable, ErrorCode.invalidValue)
            return nil
        }
        return value
    }

    /// Rejects the call with `INVALID_KEY` and returns `nil` unless the call carries a
    /// non-empty (once trimmed) `key` option.
    private func requireKey(_ call: CAPPluginCall) -> String? {
        guard let key = call.getString(OptionKey.key), self.isValidKey(key) else {
            call.reject(ErrorMessage.invalidKey, ErrorCode.invalidKey)
            return nil
        }
        return key
    }

    /// A valid key must be non-nil and non-empty once surrounding whitespace is trimmed.
    private func isValidKey(_ key: String) -> Bool {
        return !key.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    /// Rejects the call with `ITEM_NOT_FOUND` and returns `false` unless `key` exists in `keychain`.
    private func requireExistingItem(
        _ key: String,
        in keychain: SimpleKeychain,
        _ call: CAPPluginCall
    ) throws -> Bool {
        guard try keychain.hasItem(forKey: key) else {
            call.reject(ErrorMessage.itemNotFound, ErrorCode.itemNotFound)
            return false
        }
        return true
    }

    private func requireAccessibility(_ call: CAPPluginCall) -> Accessibility? {
        guard let rawValue = call.options[OptionKey.accessibility] else {
            return Accessibility.afterFirstUnlockThisDeviceOnly
        }
        guard let value = rawValue as? String else {
            call.reject(ErrorMessage.invalidAccessibility, ErrorCode.invalidValue)
            return nil
        }

        switch value {
        case "whenUnlocked":
            return Accessibility.whenUnlocked
        case "whenUnlockedThisDeviceOnly":
            return Accessibility.whenUnlockedThisDeviceOnly
        case "whenPasscodeSetThisDeviceOnly":
            return Accessibility.whenPasscodeSetThisDeviceOnly
        case "afterFirstUnlock":
            return Accessibility.afterFirstUnlock
        case "afterFirstUnlockThisDeviceOnly":
            return Accessibility.afterFirstUnlockThisDeviceOnly
        default:
            call.reject(ErrorMessage.invalidAccessibility, ErrorCode.invalidValue)
            return nil
        }
    }
}
