package com.lcorg.capacitor_secure_storage;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;

import android.content.Context;
import android.content.ContextWrapper;
import android.content.SharedPreferences;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PluginCall;
import java.util.HashSet;
import java.util.Set;
import org.json.JSONException;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;

@RunWith(AndroidJUnit4.class)
public class SecureStoragePluginTest {

  private static final String TEST_CALLBACK_ID = "test";
  private static final String STORAGE_UNAVAILABLE_TEST_MESSAGE = "Encrypted storage unavailable for test";
  private static final String EXPECTED_JS_ARRAY_MESSAGE = "Expected value to be a JSArray";

  private SecureStoragePlugin plugin;

  @Before
  public void setUp() {
    plugin = createPlugin(InstrumentationRegistry.getInstrumentation().getTargetContext());
    clearStorage();
  }

  @After
  public void tearDown() {
    clearStorage();
  }

  @Test
  public void storesAndReadsValues() {
    PluginCallResult setResult = set("token", "pässwörd \uD83D\uDD10 \u4F60\u597D");
    PluginCallResult getResult = get("token");

    assertTrue(setResult.isSuccessful());
    assertNull(setResult.result);
    assertEquals("pässwörd \uD83D\uDD10 \u4F60\u597D", getResult.value());
  }

  @Test
  public void overwritesValuesAndListsKeys() {
    set("token", "first");
    set("token", "second");
    set("empty", "");

    assertEquals("second", get("token").value());
    assertEquals(Set.of("token", "empty"), keys());
  }

  @Test
  public void removesValuesAndClearsStorage() {
    set("one", "1");
    set("two", "2");

    PluginCallResult removeResult = remove("one");
    assertTrue(removeResult.isSuccessful());
    assertNull(removeResult.result);
    assertEquals(SecureStoragePlugin.ErrorCode.ITEM_NOT_FOUND, get("one").errorCode);

    PluginCallResult clearResult = clearStorage();
    assertTrue(clearResult.isSuccessful());
    assertNull(clearResult.result);
    assertTrue(keys().isEmpty());
    assertEquals(SecureStoragePlugin.ErrorCode.ITEM_NOT_FOUND, get("two").errorCode);
  }

  @Test
  public void rejectsInvalidKeys() {
    for (String key : new String[] { null, "", " \t\n" }) {
      assertEquals(SecureStoragePlugin.ErrorCode.INVALID_KEY, get(key).errorCode);
      assertEquals(SecureStoragePlugin.ErrorCode.INVALID_KEY, remove(key).errorCode);
      assertEquals(SecureStoragePlugin.ErrorCode.INVALID_KEY, set(key, "value").errorCode);
    }
  }

  @Test
  public void rejectsMissingValuesAndItems() {
    assertEquals(SecureStoragePlugin.ErrorCode.INVALID_VALUE, set("token", null).errorCode);
    assertEquals(SecureStoragePlugin.ErrorCode.ITEM_NOT_FOUND, get("missing").errorCode);
    assertEquals(SecureStoragePlugin.ErrorCode.ITEM_NOT_FOUND, remove("missing").errorCode);
  }

  @Test
  public void reportsStorageInitializationFailures() {
    Context unavailableContext = new ContextWrapper(InstrumentationRegistry.getInstrumentation().getTargetContext()) {
      @Override
      public Context getApplicationContext() {
        return this;
      }

      @Override
      public SharedPreferences getSharedPreferences(String name, int mode) {
        throw new SecurityException(STORAGE_UNAVAILABLE_TEST_MESSAGE);
      }
    };
    SecureStoragePlugin unavailablePlugin = createPlugin(unavailableContext);

    PluginCallResult result = keys(unavailablePlugin);

    assertEquals(SecureStoragePlugin.ErrorCode.STORAGE_ERROR, result.errorCode);
    assertNull(result.result);
  }

  private SecureStoragePlugin createPlugin(Context context) {
    return new SecureStoragePlugin(new EncryptedStorageHelper(context));
  }

  private PluginCallResult set(String key, String value) {
    RecordingPluginCall call = call(
      SecureStoragePlugin.MethodName.SET,
      new JSObject().put(SecureStoragePlugin.OptionKey.KEY, key).put(SecureStoragePlugin.OptionKey.VALUE, value)
    );
    plugin.set(call);
    return new PluginCallResult(call);
  }

  private PluginCallResult get(String key) {
    return get(plugin, key);
  }

  private PluginCallResult get(SecureStoragePlugin secureStoragePlugin, String key) {
    RecordingPluginCall call = call(
      SecureStoragePlugin.MethodName.GET,
      new JSObject().put(SecureStoragePlugin.OptionKey.KEY, key)
    );
    secureStoragePlugin.get(call);
    return new PluginCallResult(call);
  }

  private PluginCallResult remove(String key) {
    RecordingPluginCall call = call(
      SecureStoragePlugin.MethodName.REMOVE,
      new JSObject().put(SecureStoragePlugin.OptionKey.KEY, key)
    );
    plugin.remove(call);
    return new PluginCallResult(call);
  }

  private Set<String> keys() {
    return keys(plugin).keys();
  }

  private PluginCallResult keys(SecureStoragePlugin secureStoragePlugin) {
    RecordingPluginCall call = call(SecureStoragePlugin.MethodName.KEYS, new JSObject());
    secureStoragePlugin.keys(call);
    return new PluginCallResult(call);
  }

  private PluginCallResult clearStorage() {
    RecordingPluginCall call = call(SecureStoragePlugin.MethodName.CLEAR, new JSObject());
    plugin.clear(call);
    return new PluginCallResult(call);
  }

  private RecordingPluginCall call(String method, JSObject options) {
    return new RecordingPluginCall(method, options);
  }

  private static class PluginCallResult {

    private final JSObject result;
    private final String errorCode;
    private final boolean resolved;

    PluginCallResult(RecordingPluginCall call) {
      result = call.result;
      errorCode = call.errorCode;
      resolved = call.resolved;
    }

    boolean isSuccessful() {
      return resolved && errorCode == null;
    }

    String value() {
      return result.getString(SecureStoragePlugin.OptionKey.VALUE);
    }

    Set<String> keys() {
      try {
        return new HashSet<>(((JSArray) result.get(SecureStoragePlugin.OptionKey.VALUE)).toList());
      } catch (JSONException exception) {
        throw new AssertionError(EXPECTED_JS_ARRAY_MESSAGE, exception);
      }
    }
  }

  private static class RecordingPluginCall extends PluginCall {

    private JSObject result;
    private String errorCode;
    private boolean resolved;

    RecordingPluginCall(String method, JSObject options) {
      super(null, SecureStoragePlugin.PluginName.VALUE, TEST_CALLBACK_ID, method, options);
    }

    @Override
    public void resolve(JSObject data) {
      result = data;
      resolved = true;
    }

    @Override
    public void resolve() {
      resolved = true;
    }

    @Override
    public void reject(String message, String code) {
      errorCode = code;
    }

    @Override
    public void reject(String message, String code, Exception exception) {
      errorCode = code;
    }
  }
}
