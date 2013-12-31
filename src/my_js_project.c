#include <pebble.h>

static Window *window;
//Layers
static TextLayer *stop_num_layer;
static TextLayer *route_num_layer;
static TextLayer *minutes_layer;
//string values:
static char stop_num[12];
static char route_num[10];
static char minutes[17];

enum {
  STOP_NUM = 0x0,
  ROUTE_NUM = 0x1,
  MINUTES = 0x2,
};

static void in_received_handler(DictionaryIterator *iter, void *context) {
  //Handle a new app message from phone
  Tuple *stop_num_tuple = dict_find(iter, STOP_NUM);
  Tuple *route_num_tuple = dict_find(iter, ROUTE_NUM);
  Tuple *minutes_tuple = dict_find(iter, MINUTES);

  if (stop_num_tuple) {
    APP_LOG(APP_LOG_LEVEL_DEBUG, "setting stop num");
    APP_LOG(APP_LOG_LEVEL_DEBUG, stop_num);

    strncpy(stop_num, stop_num_tuple->value->cstring, 12);
    APP_LOG(APP_LOG_LEVEL_DEBUG, stop_num);

    text_layer_set_text(stop_num_layer, stop_num);
  }

  if (route_num_tuple) {
    strncpy(route_num, route_num_tuple->value->cstring,10);
    text_layer_set_text(route_num_layer, route_num);
  }

  if (minutes_tuple) {
    strncpy(minutes, minutes_tuple->value->cstring, 17);
    text_layer_set_text(minutes_layer, minutes);
  }

}

static void in_dropped_handler(AppMessageResult reason, void *context) {
  APP_LOG(APP_LOG_LEVEL_DEBUG, "App Message Dropped!");
}

static void out_failed_handler(DictionaryIterator *failed, AppMessageResult reason, void *context) {
  APP_LOG(APP_LOG_LEVEL_DEBUG, "App Message Failed to Send!");
}

static void out_sent_handler(DictionaryIterator *sent, void *context) {
  APP_LOG(APP_LOG_LEVEL_DEBUG, "App Message Sent");

  //text_layer_set_text(route_num_layer, route_num);
  //text_layer_set_text(stop_num_layer, stop_num);
  //text_layer_set_text(minutes_layer, "Loading...");
}

static void select_click_handler(ClickRecognizerRef recognizer, void *context) {
  //text_layer_set_text(text_layer, "Select");
}

static void up_click_handler(ClickRecognizerRef recognizer, void *context) {
  //text_layer_set_text(text_layer, "Up");
}

static void down_click_handler(ClickRecognizerRef recognizer, void *context) {
  //text_layer_set_text(text_layer, "Down");
}

static void click_config_provider(void *context) {
  window_single_click_subscribe(BUTTON_ID_SELECT, select_click_handler);
  window_single_click_subscribe(BUTTON_ID_UP, up_click_handler);
  window_single_click_subscribe(BUTTON_ID_DOWN, down_click_handler);
}

static void window_load(Window *window) {
  Layer *window_layer = window_get_root_layer(window);
  GRect bounds = layer_get_bounds(window_layer);

  stop_num_layer = text_layer_create((GRect) { .origin = { 0, 10 }, .size = { bounds.size.w, bounds.size.h/3 } });
  text_layer_set_text_alignment(stop_num_layer, GTextAlignmentCenter);
  layer_add_child(window_layer, text_layer_get_layer(stop_num_layer));

  route_num_layer = text_layer_create((GRect) { .origin = { 0, bounds.size.h/3 + 10}, .size = { bounds.size.w, bounds.size.h/3 } });
  text_layer_set_text(route_num_layer, "Loading...");
  text_layer_set_text_alignment(route_num_layer, GTextAlignmentCenter);
  layer_add_child(window_layer, text_layer_get_layer(route_num_layer));

  minutes_layer = text_layer_create((GRect) { .origin = { 0, bounds.size.h*2/3 + 10}, .size = { bounds.size.w, bounds.size.h/3 } });
  text_layer_set_text_alignment(minutes_layer, GTextAlignmentCenter);
  layer_add_child(window_layer, text_layer_get_layer(minutes_layer));

}

static void window_unload(Window *window) {
  text_layer_destroy(stop_num_layer);
  text_layer_destroy(route_num_layer);
  text_layer_destroy(minutes_layer);
}

static void fetch_stop_time(void) {
  APP_LOG(APP_LOG_LEVEL_DEBUG, "Fetching stop time");
  DictionaryIterator *iter;
  app_message_outbox_begin(&iter);
  Tuplet value = TupletInteger(1, 42);
  dict_write_tuplet(iter, &value);
  app_message_outbox_send();
}

static void app_message_init(void) {
  //Register message handlers
  app_message_register_inbox_received(in_received_handler);
  app_message_register_inbox_dropped(in_dropped_handler);
  app_message_register_outbox_failed(out_failed_handler);
  app_message_register_outbox_sent(out_sent_handler);
  //Init buffers
  app_message_open(64, 64);
  fetch_stop_time();
}

static void init(void) {
  window = window_create();
  app_message_init();
  window_set_click_config_provider(window, click_config_provider);
  window_set_window_handlers(window, (WindowHandlers) {
    .load = window_load,
    .unload = window_unload,
  });
  const bool animated = true;
  window_stack_push(window, animated);
}

static void deinit(void) {
  window_destroy(window);
}

int main(void) {
  init();

  APP_LOG(APP_LOG_LEVEL_DEBUG, "Done initializing, pushed window: %p", window);

  app_event_loop();
  deinit();
}
