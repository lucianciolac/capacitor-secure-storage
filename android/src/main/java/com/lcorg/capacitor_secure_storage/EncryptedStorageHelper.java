package com.lcorg.capacitor_secure_storage;

import android.annotation.SuppressLint;
import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;
import androidx.security.crypto.EncryptedSharedPreferences;
import androidx.security.crypto.MasterKey;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.util.Objects;

public class EncryptedStorageHelper {

  private static final String LOG_TAG = EncryptedStorageHelper.class.getSimpleName();
  static final String ESP_PREFERENCES_FILE = "cap_sec_esp";
  private static final String CONTEXT_REQUIRED_MESSAGE = "Context must not be null";
  private static final String DATA_REQUIRED_MESSAGE = "Data must not be null";
  static final String STORAGE_INITIALIZATION_ERROR_MESSAGE = "Unable to initialize encrypted storage";
  private static final String STORAGE_PERSISTENCE_ERROR_MESSAGE = "Unable to persist encrypted storage changes";

  private final SharedPreferences preferences;
  private final IllegalStateException initializationError;

  public EncryptedStorageHelper(Context context) {
    Objects.requireNonNull(context, CONTEXT_REQUIRED_MESSAGE);
    Context applicationContext = context.getApplicationContext();
    Context appContext = applicationContext != null ? applicationContext : context;

    SharedPreferences encryptedPreferences = null;
    IllegalStateException error = null;

    try {
      MasterKey masterKey = new MasterKey.Builder(appContext).setKeyScheme(MasterKey.KeyScheme.AES256_GCM).build();

      encryptedPreferences = EncryptedSharedPreferences.create(
        appContext,
        ESP_PREFERENCES_FILE,
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
      );
    } catch (GeneralSecurityException | IOException | SecurityException exception) {
      error = new IllegalStateException(STORAGE_INITIALIZATION_ERROR_MESSAGE, exception);
      Log.e(LOG_TAG, error.getMessage(), exception);
    }

    preferences = encryptedPreferences;
    initializationError = error;
  }

  public void setData(String key, byte[] data) {
    setString(key, new String(Objects.requireNonNull(data, DATA_REQUIRED_MESSAGE), StandardCharsets.UTF_8));
  }

  public byte[] getData(String key) {
    String value = getString(key);
    return value != null ? value.getBytes(StandardCharsets.UTF_8) : null;
  }

  public void setString(String key, String value) {
    commit(getPreferences().edit().putString(key, value));
  }

  public String getString(String key) {
    return getPreferences().getString(key, null);
  }

  public boolean contains(String key) {
    return getPreferences().contains(key);
  }

  public String[] keys() {
    return getPreferences()
      .getAll()
      .keySet()
      .toArray(new String[0]);
  }

  public void remove(String key) {
    commit(getPreferences().edit().remove(key));
  }

  public void clear() {
    commit(getPreferences().edit().clear());
  }

  private SharedPreferences getPreferences() {
    if (initializationError != null) {
      throw initializationError;
    }
    return preferences;
  }

  @SuppressLint("ApplySharedPref")
  private void commit(SharedPreferences.Editor editor) {
    if (!editor.commit()) {
      throw new IllegalStateException(STORAGE_PERSISTENCE_ERROR_MESSAGE);
    }
  }
}
