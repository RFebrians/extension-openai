// Function to inject buttons next to each tweet
function addCheckboxesToTweets() {
  const tweets = document.querySelectorAll('[data-testid="tweetText"]');

  tweets.forEach((tweet) => {
    // Create a button element for main tweet
    const button = document.createElement("button");
    button.className = "checkbox-label";
    button.style.float = "right";
    button.style.padding = "10px";
    button.style.border = "2px solid red";
    button.style.borderRadius = "5px";
    button.style.backgroundColor = "white";
    button.style.color = "red";
    button.style.fontWeight = "bold";
    button.style.cursor = "pointer";
    button.innerText = "Generate AI Powered Reply";

    // Change button appearance when clicked (simulating a checkbox)
    let isChecked = false;
    button.addEventListener("click", () => {
      isChecked = !isChecked; // Toggle the checked state
      if (isChecked) {
        button.style.backgroundColor = "red";
        button.style.color = "white";
        console.log("Selected tweet:", tweet.innerText);
        // Store selected tweet in chrome.storage or process it further
        chrome.storage.sync.get(["selectedTweets"], function (result) {
          let selectedTweets = result.selectedTweets || [];
          selectedTweets.push(tweet.innerText);
          chrome.storage.sync.set({ selectedTweets });
        });
      } else {
        button.style.backgroundColor = "white";
        button.style.color = "red";
        // Remove unselected tweet
        chrome.storage.sync.get(["selectedTweets"], function (result) {
          let selectedTweets = result.selectedTweets || [];
          selectedTweets = selectedTweets.filter((t) => t !== tweet.innerText);
          chrome.storage.sync.set({ selectedTweets });
        });
      }
    });

    // Insert the button before the tweet text (only for parent tweets)
    if (!tweet.parentNode.querySelector(".checkbox-label")) {
      tweet.parentNode.insertBefore(button, tweet);
    }

    // Check if the tweet has child tweets (replies)
    const tweetParent = tweet.closest('[data-testid="tweet"]');
    if (
      tweetParent &&
      tweetParent.querySelectorAll('[data-testid="tweet"]').length > 1
    ) {
      // Add a separate button for the child tweets
      const childTweets = tweetParent.querySelectorAll(
        '[data-testid="tweetText"]'
      );
      childTweets.forEach((childTweet, index) => {
        // Skip the first tweet as it's the parent
        if (index === 0) return;

        const replyButton = document.createElement("button");
        replyButton.className = "checkbox-reply-label";
        replyButton.style.float = "right";
        replyButton.style.padding = "10px";
        replyButton.style.border = "2px solid blue";
        replyButton.style.borderRadius = "5px";
        replyButton.style.backgroundColor = "white";
        replyButton.style.color = "blue";
        replyButton.style.fontWeight = "bold";
        replyButton.style.cursor = "pointer";
        replyButton.innerText = "Generate Reply for Thread";

        let isReplyChecked = false;
        replyButton.addEventListener("click", () => {
          isReplyChecked = !isReplyChecked; // Toggle the checked state for child tweet
          if (isReplyChecked) {
            replyButton.style.backgroundColor = "blue";
            replyButton.style.color = "white";
            console.log("Selected child tweet:", childTweet.innerText);
            // Store selected child tweet in chrome.storage or process it further
            chrome.storage.sync.get(["selectedTweets"], function (result) {
              let selectedTweets = result.selectedTweets || [];
              selectedTweets.push(childTweet.innerText);
              chrome.storage.sync.set({ selectedTweets });
            });
          } else {
            replyButton.style.backgroundColor = "white";
            replyButton.style.color = "blue";
            // Remove unselected child tweet
            chrome.storage.sync.get(["selectedTweets"], function (result) {
              let selectedTweets = result.selectedTweets || [];
              selectedTweets = selectedTweets.filter(
                (t) => t !== childTweet.innerText
              );
              chrome.storage.sync.set({ selectedTweets });
            });
          }
        });

        // Insert the reply button before the child tweet text
        if (!childTweet.parentNode.querySelector(".checkbox-reply-label")) {
          childTweet.parentNode.insertBefore(replyButton, childTweet);
        }
      });
    }
  });
}

function checkExtensionStatus() {
  chrome.storage.local.get("isRunningExtensionReplies", function (result) {
    const isRunning = result.isRunningExtensionReplies || false;

    // Alert when the extension is running
    if (isRunning) {
      // alert("AI Reply Generator is running.");
      document.getElementById("start").classList.add("d-none");
      document.getElementById("stop").classList.remove("d-none");
    } else {
      // alert("AI Reply Generator is not running.");
      document.getElementById("stop").classList.add("d-none");
      document.getElementById("start").classList.remove("d-none");
    }
  });
}

// Run the function to add buttons on page load and when DOM changes
addCheckboxesToTweets();
setInterval(addCheckboxesToTweets, 2000); // Keep checking for new tweets in case of infinite scroll
checkExtensionStatus();

// document onload #startExtension alert
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("start").addEventListener("click", () => {
    document.getElementById("start").classList.add("d-none");
    document.getElementById("stop").classList.remove("d-none");

    chrome.storage.local.set({ isRunningExtensionReplies: true }, () => {
      // alert("AI Reply Generator started");
    });
  });

  document.getElementById("stop").addEventListener("click", () => {
    document.getElementById("stop").classList.add("d-none");
    document.getElementById("start").classList.remove("d-none");

    // Set stopped state into local storage and alert
    chrome.storage.local.set({ isRunningExtensionReplies: false }, () => {
      alert("AI Reply Generator stopped");
      alert("Please reload the page to see changes");
    });
  });

  document.getElementById("close").addEventListener("click", () => {
    window.close();
  });
});
