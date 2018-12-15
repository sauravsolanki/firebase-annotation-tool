/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

// Signs-in Friendly Chat.
function signIn() {
  // Sign into Firebase using popup auth & Google as the identity provider.
  var provider = new firebase.auth.GoogleAuthProvider();
  firebase.auth().signInWithPopup(provider);
}
// Signs-out of Friendly Chat.
function signOut() {
  // Sign out of Firebase.
  firebase.auth().signOut();
}
// Initiate Firebase Auth.
function initFirebaseAuth() {
  // Listen to auth state changes.
  firebase.auth().onAuthStateChanged(authStateObserver);
}

// Returns the signed-in user's profile pic URL.
function getProfilePicUrl() {
  return firebase.auth().currentUser.photoURL || '/images/profile_placeholder.png';
}

// Returns the signed-in user's display name.
function getUserName() {
  return firebase.auth().currentUser.displayName;
}

// Returns true if a user is signed-in.
function isUserSignedIn() {
  return !!firebase.auth().currentUser;
}

// Triggers when the auth state change for instance when the user signs-in or signs-out.
function authStateObserver(user) {
  if (user) { // User is signed in!
    // Get the signed-in user's profile pic and name.
    var profilePicUrl = getProfilePicUrl();
    var userName = getUserName();

    // Set the user's profile pic and name.
    userPicElement.style.backgroundImage = 'url(' + profilePicUrl + ')';
    userNameElement.textContent = userName;

    // Show user's profile and sign-out button.
    userNameElement.removeAttribute('hidden');
    userPicElement.removeAttribute('hidden');
    signOutButtonElement.removeAttribute('hidden');
    annotaion_tool.removeAttribute('hidden')

    // Hide sign-in button.
    signInButtonElement.setAttribute('hidden', 'true');

  } else { // User is signed out!
    // Hide user's profile and sign-out button.
    userNameElement.setAttribute('hidden', 'true');
    userPicElement.setAttribute('hidden', 'true');
    signOutButtonElement.setAttribute('hidden', 'true');
    annotaion_tool.setAttribute('hidden','true');

    // Show sign-in button.
    signInButtonElement.removeAttribute('hidden');
  }
}

// Checks that the Firebase SDK has been correctly setup and configured.
function checkSetup() {
  if (!window.firebase || !(firebase.app instanceof Function) || !firebase.app().options) {
    window.alert('You have not configured and imported the Firebase SDK. ' +
        'Make sure you go through the codelab setup instructions and make ' +
        'sure you are running the codelab using `firebase serve`');
  }
}

// Loads chat message history and listens for upcoming ones.
function loadMessages() {
  // Loads the last 12 messages and listens for new ones.
  var callback = function(snap) {
    var data = snap.val();
    displayMessage(snap.key, data.name, data.text, data.profilePicUrl, data.imageUrl);
  };

  firebase.database().ref('/messages/').limitToLast(12).on('child_added', callback);
  firebase.database().ref('/messages/').limitToLast(12).on('child_changed', callback);
}

// Saves a new message containing an image in Firebase.
// This method first saves the image in Cloud Storage.
function saveImageMessage(file) {
  // 1 - Add a chat message placeholder (a loading icon) that will ultimately get updated with the shared image.
  firebase.database().ref('/messages/').push({
    name: getUserName(),
    imageUrl: LOADING_IMAGE_URL,
    profilePicUrl: getProfilePicUrl()
  }).then(function(messageRef) {
    // 2 - Upload the image to Cloud Storage.
    var filePath = firebase.auth().currentUser.uid + '/' + messageRef.key + '/' + file.name;
    return firebase.storage().ref(filePath).put(file).then(function(fileSnapshot) {
      // 3 - Generate a public URL for the image file.
      return fileSnapshot.ref.getDownloadURL().then((url) => {
        // 4 - Update the chat message placeholder with the image's URL.
        return messageRef.update({
          imageUrl: url,
          storageUri: fileSnapshot.metadata.fullPath
        });
      });
    });
  }).catch(function(error) {
    console.error('There was an error uploading a file to Cloud Storage:', error);
  });
}

// Checks that Firebase has been imported.
checkSetup();

var userPicElement = document.getElementById('user-pic');
var userNameElement = document.getElementById('user-name');
var signInButtonElement = document.getElementById('sign-in');
var signOutButtonElement = document.getElementById('sign-out');
var signInSnackbarElement = document.getElementById('must-signin-snackbar');
var annotaion_tool = document.getElementById('annotaion_tool');

signOutButtonElement.addEventListener('click', signOut);
signInButtonElement.addEventListener('click', signIn);

// initialize Firebase
initFirebaseAuth();
