import contractABI from "./abi.json";
import { Web3 } from "web3";

const contractAddress = "0x3945d5E56A4cA8F3bE468dc03605136fdcfE63EC";

let web3 = new Web3(window.ethereum);
let contract = new web3.eth.Contract(contractABI, contractAddress);

async function connectWallet() {
  if (window.ethereum) {
    const accounts = await window.ethereum
      .request({ method: "eth_requestAccounts" })
      .catch((err) => {
        if (err.code === 4001) {
          console.log("please connect MetaMask.");
        } else {
          console.error(err);
        }
      });
    console.log(accounts);
    setConnected(accounts[0]);
  } else {
    console.error("No web3 provider detected");
    document.getElementById("connectMessage").innerText =
      "No web3 provider detected. Please install MetaMask.";
  }
}

async function createTweet(content) {
  const accounts = await web3.eth.getAccounts();
  try {
    await contract.methods.tweet(content).send({ from: accounts[0] });
    getTweets(accounts[0]);
  } catch (error) {
    console.error("user rejected:", error);
  }
}

async function getTweets(userAddress) {
  const tweetsContainer = document.getElementById("tweetsContainer");
  tweetsContainer.innerHTML = "";
  const tempTweets = await contract.methods.getAllTweets(userAddress).call();
  const tweets = [...tempTweets];
  tweets.sort((a, b) => Number(b.timestamp) - Number(a.timestamp));
  for (let i = 0; i < tweets.length; i++) {
    const tweetElement = document.createElement("div");
    tweetElement.className = "tweet";

    const userIcon = document.createElement("img");
    userIcon.className = "user-Icon";
    userIcon.src = `https://api.dicebear.com/9.x/pixel-art/svg`;
    userIcon.alt = "User Icon";

    tweetElement.appendChild(userIcon);

    const tweetInner = document.createElement("div");
    tweetInner.className = "tweet-inner";

    tweetInner.innerHTML += `
     <div class="author">${shortAddress(tweets[i].author)}</div>
        <div class="content">${tweets[i].content}</div>
    `;

    const likeButton = document.createElement("button");
    likeButton.className = "like-button";
    likeButton.innerHTML = `
    <span class="likes-count">${tweets[i].likes}</span>
    `;

    likeButton.setAttribute("data-id", tweets[i].id);
    likeButton.setAttribute("data-author", tweets[i].author);
    addLikeButtonListener(
      likeButton,
      userAddress,
      tweets[i].id,
      tweets[i].author
    );
    tweetInner.appendChild(likeButton);
    tweetElement.appendChild(tweetInner);

    tweetsContainer.appendChild(tweetElement);
  }
}

function addLikeButtonListener(likeButton, address, id, author) {
  likeButton.addEventListener("click", async (e) => {
    e.preventDefault();
    e.currentTarget.innerHTML = `<div class=
    "spinner"></div>`;
    e.currentTarget.disabled = true;
    try {
      await likeTweet(author, id);
      getTweets(address);
    } catch (error) {
      console.error("Error liking tweet:", error);
    }
  });
}

function shortAddress(address, startLength = 6, endLength = 4) {
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
}

async function likeTweet(author, id) {
  try {
    const accounts = await web3.eth.getAccounts();
    await contract.methods.likeTweet(author, id).send({ from: accounts[0] });
  } catch (error) {
    console.error("User rejected request:", error);
  }
}

function setConnected(address) {
  document.getElementById("userAddress").innerText =
    "connected " + shortAddress(address);
  document.getElementById("connectMessage").style.display = "none";
  document.getElementById("connectBtn").style.display = "none";
  document.getElementById("tweetForm").style.display = "block";
  getTweets(address);
}
document.getElementById("connectBtn").addEventListener("click", connectWallet);

document.getElementById("tweetForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const content = document.getElementById("tweetContent").value;
  const tweetSubmitButton = document.getElementById("tweetSubmitBtn");
  tweetSubmitButton.innerHTML = `<div class ="spinner"></div>`;
  tweetSubmitButton.disabled = true;

  try {
    await createTweet(content);
  } catch (error) {
    console.error("Errror sending tweet:", error);
  } finally {
    tweetSubmitButton.innerHTML = "Tweet";
    tweetSubmitButton.disabled = false;
  }
});
