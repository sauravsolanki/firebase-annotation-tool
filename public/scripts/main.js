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
  annotaion_dashboardDiv.setAttribute('hidden','true')
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
    dashboardButtonElement.removeAttribute('hidden')

    // Hide sign-in button.
    signInButtonElement.setAttribute('hidden', 'true');
  } else { // User is signed out!
    // Hide user's profile and sign-out button.
    userNameElement.setAttribute('hidden', 'true');
    userPicElement.setAttribute('hidden', 'true');
    signOutButtonElement.setAttribute('hidden', 'true');
    annotaion_tool.setAttribute('hidden','true');
    dashboardButtonElement.setAttribute('hidden','true')

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


var LOADING_IMAGE_URL = 'https://www.google.com/images/spin-32.gif?a';
//// TODO: to show loading animation
// Saves a new message containing an image in Firebase.
// This method first saves the image in Cloud Storage.
function saveImageMessage(file,filename) {
  // var d = new Date();
  // 1 - Add a chat message placeholder (a loading icon) that will ultimately get updated with the shared image.
  firebase.database().ref('/images/').push({
    name: getUserName(),
    // imageUrl: LOADING_IMAGE_URL,
    profilePicUrl: getProfilePicUrl(),
    date_of_saving:  ""+new Date(),
    user_id: firebase.auth().currentUser.uid
  }).then(function(messageRef) {
    // 2 - Upload the image to Cloud Storage.
    var filePath = firebase.auth().currentUser.uid + '/' + messageRef.key + '/' + filename;
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

function display_dashboard(){
  annotaion_tool.setAttribute('hidden',true);
  annotaion_dashboardDiv.removeAttribute('hidden');
  navbar_annotaion_tool.removeAttribute('hidden');
  dashboardButtonElement.setAttribute('hidden',true);
  loadImages();
}

function display_annotation_tool(){
  annotaion_tool.removeAttribute('hidden');
  annotaion_dashboardDiv.setAttribute('hidden',true);
  navbar_annotaion_tool.setAttribute('hidden',true);
  dashboardButtonElement.removeAttribute('hidden');

}

//displayImage(snap.key, data.name, data.date_of_saving, data.storageUri, data.imageUrl)
// Template for messages.
// var IMAGE_TEMPLATE =
//     '<div class="image-container">' +
//       // '<div class="spacing"><div class="pic"></div></div>' +
//       '<div class="name"></div>' +
//       '<div class="storageUri"></div>' +
//       '<div class="date_of_saving"></div>' +
//     '</div>';
var IMAGE_TEMPLATE =
      '<td class="name"></td>'+
      '<td class="imageURL"> <a href="" target="_blank">View</a> </td>'+
      '<td class="storageUri"></td>'+
      '<td class="date_of_saving"></td>';

// Adds a size to Google Profile pics URLs.
function addSizeToGoogleProfilePic(url) {
  if (url.indexOf('googleusercontent.com') !== -1 && url.indexOf('?') === -1) {
    return url + '?sz=150';
  }
  return url;
}

//displayImage(snap.key, data.name, data.date_of_saving, data.storageUri, data.imageUrl)
// Displays a Message in the UI.
function displayImage(key,name,date_of_saving, storageUri, imageUrl,user_id) {

  if(user_id==firebase.auth().currentUser.uid){

  var tr = document.getElementById(key);
  // If an element for that message does not exists yet we create it.
  if (!tr) {
    var container = document.createElement('tr');
    container.innerHTML = IMAGE_TEMPLATE;
    // tr = container.firstChild;
    container.setAttribute('id', key);
    usersAnnotationTableListlements.appendChild(container);
  }
  // if (picUrl) {
  //   div.querySelector('.pic').style.backgroundImage = 'url(' + addSizeToGoogleProfilePic(picUrl) + ')';
  // }
  var tr = document.getElementById(key);
  tr.querySelector('td.name').textContent = name;
  // tr.querySelectorAll('td.imageURL').textContent = imageUrl;
   tr.querySelector('td.imageURL > a').href = imageUrl;
  tr.querySelector('td.storageUri').textContent = storageUri;
  tr.querySelector('td.date_of_saving').textContent = date_of_saving;

  // var messageElement = div.querySelector('.image');
  //
  // if (imageUrl) { // If the message is an image.
  //   var image = document.createElement('img');
  //   image.addEventListener('load', function() {
  //     messageListElement.scrollTop = messageListElement.scrollHeight;
  //   });
  //   image.src = imageUrl + '&' + new Date().getTime();
  //   messageElement.innerHTML = '';
  //   messageElement.appendChild(image);
  // }
}}
// date_of_saving:
// imageUrl:
// name:
// profilePicUrl:
// storageUri:
// user_id:

// displayMessage(key,name,date_of_saving, storageUri, imageUrl)
// Loads chat message history and listens for upcoming ones.
function loadImages() {
  // Loads the last 12 messages and listens for new ones.
  var callback = function(snap) {
    var data = snap.val();
    displayImage(snap.key, data.name, data.date_of_saving, data.storageUri, data.imageUrl,data.user_id);
  };
// TODO:  Add  per users dashboard
  firebase.database().ref('/images/').limitToLast(20).on('child_added', callback);
  firebase.database().ref('/images/').limitToLast(20).on('child_changed', callback);
}


var userPicElement = document.getElementById('user-pic');
var userNameElement = document.getElementById('user-name');
var signInButtonElement = document.getElementById('sign-in');
var signOutButtonElement = document.getElementById('sign-out');
var signInSnackbarElement = document.getElementById('must-signin-snackbar');
var annotaion_tool = document.getElementById('annotaion_tool');

var dashboardButtonElement = document.getElementById('sign-dashboard');
var annotaion_dashboardDiv = document.getElementById('annotaion_dashboard');
var navbar_annotaion_toolButton = document.getElementById('navbar_annotaion_tool');

var usersAnnotationTableListlements = document.getElementById('table_users_annotation');

signOutButtonElement.addEventListener('click', signOut);
signInButtonElement.addEventListener('click', signIn);
dashboardButtonElement.addEventListener('click',display_dashboard)
navbar_annotaion_toolButton.addEventListener('click',display_annotation_tool)

// initialize Firebase
initFirebaseAuth();
