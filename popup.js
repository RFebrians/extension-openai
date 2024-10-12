// Function to display selected tweets with AI Reply, Copy, and Delete buttons
function displaySelectedTweets() {
  chrome.storage.sync.get(["selectedTweets"], function (result) {
    const tweetList = document.getElementById("tweetList");
    tweetList.innerHTML = ""; // Clear previous list
    const selectedTweets = result.selectedTweets || [];

    selectedTweets.forEach((tweet) => {
      let listItem = document.createElement("li");
      listItem.className = "list-group-item";
      listItem.innerText = tweet;

      // create a new div group
      let divGroup = document.createElement("div");
      divGroup.className = "float-end";

      // Add a reply button based on AI next to each tweet
      let replyButton = document.createElement("button");
      let apiKey = document.getElementById("apiKey").value;
      replyButton.className = "btn btn-sm btn-outline-primary me-2";
      replyButton.innerText = "AI Reply";
      replyButton.addEventListener("click", () => {
        generateAIReply(apiKey, tweet, listItem);
      });

      // Add a delete button next to each tweet to remove it
      let deleteButton = document.createElement("button");
      deleteButton.className = "btn btn-sm btn-outline-danger";
      // <i class="fa fa-delete"></i>
      deleteButton.innerHTML = `<i class="fa fa-trash"></i>`;
      deleteButton.addEventListener("click", () => {
        deleteTweet(tweet);
        listItem.remove(); // Remove the tweet from the UI
      });

      divGroup.appendChild(replyButton);
      divGroup.appendChild(deleteButton);
      listItem.appendChild(divGroup);
      tweetList.appendChild(listItem);
    });
  });
}

// Function to call OpenAI API and generate a reply
async function generateAIReply(apiKey, tweet, listItem) {
  const tone =
    document.querySelector(".badge-btn.active")?.dataset?.emotion || "neutral";
  const customStyle = document.getElementById("customStyle").value;
  const includeImage = document.getElementById("includeImage").checked;
  const defaultCommand = document.getElementById("defaultCommand").value;

  // if tweet are empty then defaultCommand Added
  if (tweet === "") {
    tweet = defaultCommand;
  }

  const messages = [
    {
      role: "user",
      content: `Generate a ${tone} reply for this tweet: "${tweet}"${
        customStyle ? " in the tone of " + customStyle : ""
      }`,
    },
  ];

  const userModel = document.getElementById("model").value;

  // Remove existing elements
  listItem
    .querySelectorAll("input, .copy-btn, img, .loading-icon")
    .forEach((el) => el.remove());

  // Make a POST request to OpenAI API to generate the reply
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: userModel,
      messages: messages,
      temperature: 0.5,
    }),
  });

  if (response.ok) {
    const data = await response.json();
    const reply = data.choices[0].message.content.trim();

    // Save the generated reply to localStorage
    let savedReplies = JSON.parse(localStorage.getItem("aiReplies")) || {};
    savedReplies[tweet] = { reply: reply };
    localStorage.setItem("aiReplies", JSON.stringify(savedReplies));

    // Display the generated reply
    let replyInput = document.createElement("input");
    replyInput.type = "text";
    replyInput.className = "form-control mt-2";
    replyInput.readOnly = true;
    replyInput.value = reply;
    listItem.appendChild(replyInput);

    // Add a copy button with icon
    let copyButton = document.createElement("button");
    copyButton.className = "btn btn-sm btn-outline-secondary copy-btn mt-1";
    copyButton.innerHTML = '<i class="fa fa-copy"></i> Copy Response';
    copyButton.addEventListener("click", () => {
      navigator.clipboard.writeText(replyInput.value);
      alert("Reply copied to clipboard!");
    });
    listItem.appendChild(copyButton);

    // Include AI-generated image if requested
    if (includeImage) {
      const loader = document.createElement("img");
      loader.src = "https://media.tenor.com/-n8JvVIqBXkAAAAM/dddd.gif";
      loader.alt = "Loading...";
      loader.className = "loading-icon img-fluid mt-2";
      listItem.appendChild(loader);

      const imageResponse = await fetch(
        "https://api.openai.com/v1/images/generations",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            prompt: `Generate an image that fits the tone: ${tone} and matches this reply: "${reply}"`,
            n: 1,
            size: "1024x1024",
          }),
        }
      );

      if (imageResponse.ok) {
        const imageData = await imageResponse.json();
        const imageUrl = imageData.data[0].url;

        loader.remove();

        const img = document.createElement("img");
        img.src = imageUrl;
        img.alt = `${tone} AI-generated image`;
        img.className = "img-fluid mt-2";
        listItem.appendChild(img);

        // Save the generated image URL to localStorage
        savedReplies[tweet].image = imageUrl;
        localStorage.setItem("aiReplies", JSON.stringify(savedReplies));
      } else {
        loader.remove();
        alert("Error generating image.");
      }
    }
  } else {
    const error = await response.json();
    alert("Error: " + error.error.message);
  }
}

// Function to delete a tweet from the selected list and storage
function deleteTweet(tweet) {
  chrome.storage.sync.get(["selectedTweets"], function (result) {
    let selectedTweets = result.selectedTweets || [];
    selectedTweets = selectedTweets.filter((t) => t !== tweet);
    chrome.storage.sync.set({ selectedTweets });

    // Remove the AI reply and image from localStorage
    let savedReplies = JSON.parse(localStorage.getItem("aiReplies")) || {};
    delete savedReplies[tweet];
    localStorage.setItem("aiReplies", JSON.stringify(savedReplies));
  });
}

// Initialize the UI when the popup is opened
document.addEventListener("DOMContentLoaded", () => {
  displaySelectedTweets();

  // Load the saved API key
  const savedApiKey = localStorage.getItem("apiKey");
  if (savedApiKey) {
    document.getElementById("apiKey").value = savedApiKey;
  }

  // Save the API key to localStorage
  document.getElementById("saveApiKeyButton").addEventListener("click", () => {
    const apiKey = document.getElementById("apiKey").value;
    if (apiKey) {
      localStorage.setItem("apiKey", apiKey);
      alert("API Key saved successfully!");
    } else {
      alert("Please enter a valid API Key.");
    }
  });

  // listened for settings button
  document.getElementById("settings").addEventListener("click", () => {
    document.querySelector(".settingsPage").classList.toggle("d-none");
    document.querySelector(".mainpage").classList.toggle("d-none");
    // change button text and icon
    const settingsButton = document.getElementById("settings");
    const settingsValue = settingsButton.getAttribute("data-setting");
    if (settingsValue === "true") {
      settingsButton.innerHTML = '<i class="fa fa-bars"></i> Menu';
      settingsButton.setAttribute("data-setting", "false");
    } else {
      settingsButton.innerHTML = '<i class="fa fa-cog"></i> Settings';
      settingsButton.setAttribute("data-setting", "true");
    }
  });

  // Generate AI replies for all selected tweets
  document.getElementById("generateReply").addEventListener("click", () => {
    chrome.storage.sync.get(["selectedTweets"], function (result) {
      const selectedTweets = result.selectedTweets || [];
      let apiKey = document.getElementById("apiKey").value;
      if (selectedTweets.length > 0) {
        selectedTweets.forEach((tweet) => {
          generateAIReply(apiKey, tweet);
        });
      } else {
        alert("No tweets selected.");
      }
    });
  });

  /**
   * DEFAULT COMMAND
   */
  const inputField = document.getElementById("defaultCommand");
  const savedCommand = localStorage.getItem("defaultCommand");
  if (savedCommand) {
    inputField.value = savedCommand; // Set the input field to the saved value
  }

  // Save to localStorage on each input
  inputField.addEventListener("input", (event) => {
    localStorage.setItem("defaultCommand", event.target.value); // Save the current input value to localStorage
  });
  /**
   * END DEFAULT COMMAND
   */

  /**
   * MODEL CHANGED
   */
  
  const selectElement = document.getElementById("model");

  // Load the saved model from localStorage when the page loads
  const savedModel = localStorage.getItem("selectedModel");
  if (savedModel) {
    selectElement.value = savedModel; // Set the select field to the saved value
  }

  // Save to localStorage when the selection changes
  selectElement.addEventListener("change", (event) => {
    localStorage.setItem("selectedModel", event.target.value); // Save the selected value to localStorage
  });
  /**
   *  END MODEL CHANGED
   *  
   * /


  /**
   * DEFAULT MODEL
   */

  const defaultModel = document.getElementById("defaultModel");
  defaultModel.addEventListener("click", () => {
    selectElement.value = "gpt-4o-mini";
    localStorage.setItem("selectedModel", "gpt-4o-mini");
  });
  /**
   * END DEFAULT MODEL
   */

  /**
   * TONE
   */

  // Function to select tone and handle custom input
  function selectTone(button) {
    const emotion = button.dataset.emotion;
    const customStyleInput = document.getElementById("customStyle");
    document
      .querySelectorAll(".badgeTone")
      .forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");

    if (emotion === "custom") {
      customStyleInput.removeAttribute("disabled");
      customStyleInput.value = ""; // Clear any previously set value
      customStyleInput.placeholder = "Enter custom tone or style";
    } 
    else if (emotion === "default") {
      // load the defaultCommand in the input field
      const savedCommand = localStorage.getItem("defaultCommand");
      if (savedCommand) {
        customStyleInput.value = savedCommand;
      } else {
        customStyleInput.value = "";
      }
    } 
    else {
      // Set the input field with the selected tone and disable it
      customStyleInput.value =
        emotion.charAt(0).toUpperCase() + emotion.slice(1); // Capitalize first letter
      customStyleInput.setAttribute("disabled", true); // Disable the input field
    }
  }

  // Get all buttons with the class 'badgeTone'
  const toneButtons = document.querySelectorAll(".badgeTone");
  // Attach event listener to each button
  toneButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      selectTone(this); // Pass the clicked button to the function
    });
  });
  
});
