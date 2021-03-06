// Copyright 2008 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
goog.provide('goog.async.ConditionalDelayTest');
goog.setTestOnly('goog.async.ConditionalDelayTest');

goog.require('goog.async.ConditionalDelay');
goog.require('goog.testing.MockClock');
goog.require('goog.testing.jsunit');

var invoked = false;
var delay = null;
var clock = null;
var returnValue = true;
var onSuccessCalled = false;
var onFailureCalled = false;


function callback() {
  invoked = true;
  return returnValue;
}


function setUp() {
  clock = new goog.testing.MockClock(true);
  invoked = false;
  returnValue = true;
  onSuccessCalled = false;
  onFailureCalled = false;
  delay = new goog.async.ConditionalDelay(callback);
  delay.onSuccess = function() { onSuccessCalled = true; };
  delay.onFailure = function() { onFailureCalled = true; };
}


function tearDown() {
  clock.dispose();
  delay.dispose();
}


function testDelay() {
  delay.start(200, 200);
  assertFalse(invoked);

  clock.tick(100);
  assertFalse(invoked);

  clock.tick(100);
  assertTrue(invoked);
}


function testStop() {
  delay.start(200, 500);
  assertTrue(delay.isActive());

  clock.tick(100);
  assertFalse(invoked);

  delay.stop();
  clock.tick(100);
  assertFalse(invoked);

  assertFalse(delay.isActive());
}


function testIsActive() {
  assertFalse(delay.isActive());
  delay.start(200, 200);
  assertTrue(delay.isActive());
  clock.tick(200);
  assertFalse(delay.isActive());
}


function testRestart() {
  delay.start(200, 50000);
  clock.tick(100);

  delay.stop();
  assertFalse(invoked);

  delay.start(200, 50000);
  clock.tick(199);
  assertFalse(invoked);

  clock.tick(1);
  assertTrue(invoked);

  invoked = false;
  delay.start(200, 200);
  clock.tick(200);
  assertTrue(invoked);

  assertFalse(delay.isActive());
}


function testDispose() {
  delay.start(200, 200);
  delay.dispose();
  assertTrue(delay.isDisposed());

  clock.tick(500);
  assertFalse(invoked);
}


function testConditionalDelay_Success() {
  returnValue = false;
  delay.start(100, 300);

  clock.tick(99);
  assertFalse(invoked);
  clock.tick(1);
  assertTrue(invoked);

  assertTrue(delay.isActive());
  assertFalse(delay.isDone());
  assertFalse(onSuccessCalled);
  assertFalse(onFailureCalled);

  returnValue = true;

  invoked = false;
  clock.tick(100);
  assertTrue(invoked);

  assertFalse(delay.isActive());
  assertTrue(delay.isDone());
  assertTrue(onSuccessCalled);
  assertFalse(onFailureCalled);

  invoked = false;
  clock.tick(200);
  assertFalse(invoked);
}


function testConditionalDelay_Failure() {
  returnValue = false;
  delay.start(100, 300);

  clock.tick(99);
  assertFalse(invoked);
  clock.tick(1);
  assertTrue(invoked);

  assertTrue(delay.isActive());
  assertFalse(delay.isDone());
  assertFalse(onSuccessCalled);
  assertFalse(onFailureCalled);

  invoked = false;
  clock.tick(100);
  assertTrue(invoked);
  assertFalse(onSuccessCalled);
  assertFalse(onFailureCalled);

  invoked = false;
  clock.tick(90);
  assertFalse(invoked);
  clock.tick(10);
  assertTrue(invoked);

  assertFalse(delay.isActive());
  assertFalse(delay.isDone());
  assertFalse(onSuccessCalled);
  assertTrue(onFailureCalled);
}


function testInfiniteDelay() {
  returnValue = false;
  delay.start(100, -1);

  // Test in a big enough loop.
  for (var i = 0; i < 1000; ++i) {
    clock.tick(80);
    assertTrue(delay.isActive());
    assertFalse(delay.isDone());
    assertFalse(onSuccessCalled);
    assertFalse(onFailureCalled);
  }

  delay.stop();
  assertFalse(delay.isActive());
  assertFalse(delay.isDone());
  assertFalse(onSuccessCalled);
  assertFalse(onFailureCalled);
}

function testCallbackScope() {
  var callbackCalled = false;
  var scopeObject = {};
  function internalCallback() {
    assertEquals(this, scopeObject);
    callbackCalled = true;
    return true;
  }
  delay = new goog.async.ConditionalDelay(internalCallback, scopeObject);
  delay.start(200, 200);
  clock.tick(201);
  assertTrue(callbackCalled);
}
