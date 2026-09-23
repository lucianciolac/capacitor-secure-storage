package com.lcorg.capacitor_secure_storage;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "SecureStoragePlugin")
public class SecureStoragePlugin extends Plugin {

  static final class ErrorCode {

    static final String INVALID_KEY = "INVALID_KEY";
    static final String INVALID_VALUE = "INVALID_VALUE";
    static final String ITEM_NOT_FOUND = "ITEM_NOT_FOUND";
    static final String STORAGE_ERROR = "STORAGE_ERROR";

    private ErrorCode() {}
  }

  static final class ErrorMessage {

    static final String INVALID_KEY = "Key must be a non-empty string";
    static final String INVALID_VALUE = "Value must be a string";
    static final String ITEM_NOT_FOUND = "Item with given key does not exist";
    static final String STORAGE_WRITE = "Unable to write to secure storage";
    static final String STORAGE_READ = "Unable to read from secure storage";
    static final String STORAGE_KEYS = "Unable to list secure storage keys";
    static final String STORAGE_REMOVE = "Unable to remove item from secure storage";
    static final String STORAGE_CLEAR = "Unable to clear secure storage";
    static final String STORAGE_NOT_INITIALIZED = "Secure storage is not initialized";

    private ErrorMessage() {}
  }

  static final class MethodName {

    static final String SET = "set";
    static final String GET = "get";
    static final String KEYS = "keys";
    static final String REMOVE = "remove";
    static final String CLEAR = "clear";

    private MethodName() {}
  }

  static final class OptionKey {

    static final String KEY = "key";
    static final String VALUE = "value";

    private OptionKey() {}
  }

  static final class PluginName {

    static final String VALUE = "SecureStoragePlugin";

    private PluginName() {}
  }

  private EncryptedStorageHelper encryptedStorageHelper;

  public SecureStoragePlugin() {}

  SecureStoragePlugin(EncryptedStorageHelper encryptedStorageHelper) {
    this.encryptedStorageHelper = encryptedStorageHelper;
  }

  @Override
  public void load() {
    super.load();
    this.encryptedStorageHelper = new EncryptedStorageHelper(getContext());
  }

  @PluginMethod
  public void set(PluginCall call) {
    String key = call.getString(OptionKey.KEY);
    String value = call.getString(OptionKey.VALUE);
    if (!isValidKey(key)) {
      call.reject(ErrorMessage.INVALID_KEY, ErrorCode.INVALID_KEY);
      return;
    }

    if (value == null) {
      call.reject(ErrorMessage.INVALID_VALUE, ErrorCode.INVALID_VALUE);
      return;
    }

    try {
      storage().setString(key, value);
      call.resolve();
    } catch (Exception exception) {
      rejectStorageError(call, ErrorMessage.STORAGE_WRITE, exception);
    }
  }

  @PluginMethod
  public void get(PluginCall call) {
    String key = call.getString(OptionKey.KEY);
    if (!isValidKey(key)) {
      call.reject(ErrorMessage.INVALID_KEY, ErrorCode.INVALID_KEY);
      return;
    }

    try {
      call.resolve(valueResult(readValue(key)));
    } catch (ItemNotFoundException exception) {
      call.reject(exception.getMessage(), ErrorCode.ITEM_NOT_FOUND);
    } catch (Exception exception) {
      rejectStorageError(call, ErrorMessage.STORAGE_READ, exception);
    }
  }

  @PluginMethod
  public void keys(PluginCall call) {
    try {
      call.resolve(valueResult(JSArray.from(storage().keys())));
    } catch (Exception exception) {
      rejectStorageError(call, ErrorMessage.STORAGE_KEYS, exception);
    }
  }

  @PluginMethod
  public void remove(PluginCall call) {
    String key = call.getString(OptionKey.KEY);
    if (!isValidKey(key)) {
      call.reject(ErrorMessage.INVALID_KEY, ErrorCode.INVALID_KEY);
      return;
    }

    try {
      requireExistingKey(key);
      storage().remove(key);
      call.resolve();
    } catch (ItemNotFoundException exception) {
      call.reject(exception.getMessage(), ErrorCode.ITEM_NOT_FOUND);
    } catch (Exception exception) {
      rejectStorageError(call, ErrorMessage.STORAGE_REMOVE, exception);
    }
  }

  @PluginMethod
  public void clear(PluginCall call) {
    try {
      storage().clear();
      call.resolve();
    } catch (Exception exception) {
      rejectStorageError(call, ErrorMessage.STORAGE_CLEAR, exception);
    }
  }

  private static boolean isValidKey(String key) {
    return key != null && !key.trim().isEmpty();
  }

  private EncryptedStorageHelper storage() {
    if (encryptedStorageHelper == null) {
      throw new IllegalStateException(ErrorMessage.STORAGE_NOT_INITIALIZED);
    }
    return encryptedStorageHelper;
  }

  private String readValue(String key) throws ItemNotFoundException {
    String value = storage().getString(key);
    if (value == null) {
      throw new ItemNotFoundException();
    }
    return value;
  }

  private void requireExistingKey(String key) throws ItemNotFoundException {
    if (!storage().contains(key)) {
      throw new ItemNotFoundException();
    }
  }

  private static JSObject valueResult(Object value) {
    JSObject ret = new JSObject();
    ret.put(OptionKey.VALUE, value);
    return ret;
  }

  private static void rejectStorageError(PluginCall call, String message, Exception exception) {
    call.reject(message, ErrorCode.STORAGE_ERROR, exception);
  }

  private static class ItemNotFoundException extends Exception {

    ItemNotFoundException() {
      super(ErrorMessage.ITEM_NOT_FOUND);
    }
  }
}
