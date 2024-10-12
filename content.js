// Function to inject buttons next to each tweet or article containing multiple tweets
function addCheckboxesToTweets() {
  const articles = document.querySelectorAll('article[data-testid="tweet"]');

  articles.forEach((article) => {
    const tweets = article.querySelectorAll('[data-testid="tweetText"]');

    // Check if there are multiple tweets in this article (replies)
    if (tweets.length > 1) {
      // Create a button for handling multiple replies
      const multiButton = document.createElement("button");
      multiButton.className = "multi-reply-button";
      multiButton.style.float = "right";
      multiButton.style.padding = "10px";
      multiButton.style.border = "2px solid green";
      multiButton.style.borderRadius = "5px";
      multiButton.style.backgroundColor = "white";
      multiButton.style.color = "green";
      multiButton.style.fontWeight = "bold";
      multiButton.style.cursor = "pointer";
      multiButton.innerText = "Generate Multiple AI Replies";

      // Add click event to the button to concatenate all replies
      multiButton.addEventListener("click", () => {
        let combinedReplies = "";
        tweets.forEach((tweet, index) => {
          combinedReplies += `${tweet.innerText}<br>`; // Concatenate replies with <br> for separation
        });
        alert("Multiple replies:\n" + combinedReplies); // Display concatenated replies
      });

      // Insert the button at the top of the article (for multiple replies)
      if (!article.querySelector(".multi-reply-button")) {
        article.insertBefore(multiButton, article.firstChild);
      }
    } else {
      // Single tweet handling (the existing logic)
      tweets.forEach((tweet) => {
        // Create a button element for the single tweet
        const singleButton = document.createElement("button");
        singleButton.className = "checkbox-label";
        singleButton.style.float = "right";
        singleButton.style.padding = "10px";
        singleButton.style.border = "2px solid red";
        singleButton.style.borderRadius = "5px";
        singleButton.style.backgroundColor = "white";
        singleButton.style.color = "red";
        singleButton.style.fontWeight = "bold";
        singleButton.style.cursor = "pointer";
        singleButton.innerText = "Generate AI Powered Reply";

        // Toggle button appearance when clicked (simulating a checkbox)
        let isChecked = false;
        singleButton.addEventListener("click", () => {
          isChecked = !isChecked; // Toggle the checked state
          if (isChecked) {
            singleButton.style.backgroundColor = "red";
            singleButton.style.color = "white";
            console.log("Selected tweet:", tweet.innerText);
            // Store selected tweet in chrome.storage or process it further
            chrome.storage.sync.get(["selectedTweets"], function (result) {
              let selectedTweets = result.selectedTweets || [];
              selectedTweets.push(tweet.innerText);
              chrome.storage.sync.set({ selectedTweets });
            });
          } else {
            singleButton.style.backgroundColor = "white";
            singleButton.style.color = "red";
            // Remove unselected tweet
            chrome.storage.sync.get(["selectedTweets"], function (result) {
              let selectedTweets = result.selectedTweets || [];
              selectedTweets = selectedTweets.filter(
                (t) => t !== tweet.innerText
              );
              chrome.storage.sync.set({ selectedTweets });
            });
          }
        });

        // Insert the button before the tweet text (for single replies)
        if (!tweet.parentNode.querySelector(".checkbox-label")) {
          tweet.parentNode.insertBefore(singleButton, tweet);
        }
      });
    }
  });
}

// Function to check if the extension is running and adjust the UI
function checkExtensionStatus() {
  chrome.storage.local.get("isRunningExtensionReplies", function (result) {
    const isRunning = result.isRunningExtensionReplies || false;

    // Update start/stop button visibility based on the extension status
    if (isRunning) {
      document.getElementById("start").classList.add("d-none");
      document.getElementById("stop").classList.remove("d-none");
    } else {
      document.getElementById("stop").classList.add("d-none");
      document.getElementById("start").classList.remove("d-none");
    }
  });
}

// Run the function to add buttons on page load and when DOM changes
addCheckboxesToTweets();
setInterval(addCheckboxesToTweets, 2000); // Continuously check for new tweets in case of infinite scroll
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
