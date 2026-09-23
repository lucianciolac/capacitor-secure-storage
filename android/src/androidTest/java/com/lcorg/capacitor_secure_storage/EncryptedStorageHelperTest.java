package com.lcorg.capacitor_secure_storage;

import static org.junit.Assert.assertArrayEquals;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertThrows;
import static org.junit.Assert.assertTrue;

import android.content.Context;
import android.content.ContextWrapper;
import android.content.SharedPreferences;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;

@RunWith(AndroidJUnit4.class)
public class EncryptedStorageHelperTest {

  private static final String STORAGE_UNAVAILABLE_TEST_MESSAGE = "Encrypted storage unavailable for test";
  private Context baseContext;
  private Context storageContext;
  private String preferencesName;

  @Before
  public void setUp() {
    baseContext = InstrumentationRegistry.getInstrumentation().getTargetContext();
    preferencesName = "storage-test-" + UUID.randomUUID() + "-" + EncryptedStorageHelper.ESP_PREFERENCES_FILE;
    storageContext = new ContextWrapper(baseContext) {
      @Override
      public Context getApplicationContext() {
        return this;
      }

      @Override
      public SharedPreferences getSharedPreferences(String name, int mode) {
        return baseContext.getSharedPreferences(preferencesName, Context.MODE_PRIVATE);
      }
    };
  }

  @After
  public void tearDown() {
    baseContext.deleteSharedPreferences(preferencesName);
  }

  @Test
  public void storesReadsAndListsValues() {
    EncryptedStorageHelper storage = new EncryptedStorageHelper(storageContext);
    byte[] token = "pässwörd \uD83D\uDD10 \u4F60\u597D".getBytes(StandardCharsets.UTF_8);

    storage.setData("token", token);
    storage.setData("empty", new byte[0]);

    assertArrayEquals(token, storage.getData("token"));
    assertArrayEquals(new byte[0], storage.getData("empty"));
    assertEquals(Set.of("token", "empty"), new HashSet<>(Arrays.asList(storage.keys())));
    assertNull(storage.getData("missing"));
  }

  @Test
  public void overwritesRemovesAndClearsValues() {
    EncryptedStorageHelper storage = new EncryptedStorageHelper(storageContext);
    storage.setData("token", bytes("first"));
    storage.setData("token", bytes("second"));
    storage.setData("other", bytes("value"));

    assertArrayEquals(bytes("second"), storage.getData("token"));

    storage.remove("token");
    assertNull(storage.getData("token"));

    storage.clear();
    assertEquals(0, storage.keys().length);
  }

  @Test
  public void persistsValuesAcrossHelperInstances() {
    EncryptedStorageHelper storage = new EncryptedStorageHelper(storageContext);
    storage.setData("token", bytes("value"));

    EncryptedStorageHelper recreatedStorage = new EncryptedStorageHelper(storageContext);

    assertArrayEquals(bytes("value"), recreatedStorage.getData("token"));
  }

  @Test
  public void failsOperationsWhenEncryptedStorageCannotInitialize() {
    Context unavailableContext = new ContextWrapper(storageContext) {
      @Override
      public Context getApplicationContext() {
        return this;
      }

      @Override
      public SharedPreferences getSharedPreferences(String name, int mode) {
        throw new SecurityException(STORAGE_UNAVAILABLE_TEST_MESSAGE);
      }
    };
    EncryptedStorageHelper storage = new EncryptedStorageHelper(unavailableContext);

    IllegalStateException error = assertThrows(IllegalStateException.class, () -> storage.getData("token"));

    assertEquals(EncryptedStorageHelper.STORAGE_INITIALIZATION_ERROR_MESSAGE, error.getMessage());
    assertTrue(error.getCause() instanceof SecurityException);
  }

  private static byte[] bytes(String value) {
    return value.getBytes(StandardCharsets.UTF_8);
  }
}
