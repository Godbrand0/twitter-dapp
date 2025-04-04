import { Await } from "react-router-dom";
import contractABI from "./abi.json";
import { Contract } from "web3";

const contractAddress = "";

let web3 = new Web3(window.ethereum);

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

async function creatTweet(content) {
  const accounts = await web3.eth.getsAccounts();
  try {
    await Contract.methods.creatTweet(content).send({ from: accounts[[0]] });
    displayTweets(accounts[0]);
  } catch (error) {
    console.error("user rejected:", error);
  }
}

async function displayTweets(userAddress) {
  const tweetsContainer = document.getElementById("tweetsContainer");
  tweetsContainer.innerHTML = "";
  const tempTweets = await Contract.methods.getAlltweets(userAddress).call;
  const tweets = [...tempTweets];
  tweets.sort((a, b) => b.timestamp - a.timestamp);
  for (let i = 0; i < tweets.length; i++) {
    const tweetElement = document.createElement("div");
    tweetElement.className = "tweet";

    const userIcon = document.createElement("img");
    userIcon.className = "user-Icon";
    userIcon.src = `https://avatars.dicebear.com/api/human/${tweets[i].author}.svg`;
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
  likeButton.addEventlistener("click", async (e) => {
    e.preventDefault();
    e.currentTarget.innerHTML = `<div class=
    "spinner"></div>`;
    e.currentTarget.disabled = true;
    try {
      await liketweet(author, id);
      displayTweets(address);
    } catch (error) {
      console.error("Error liking tweet:", error);
    }
  });
}

function setConnected(address) {
  document.getElementById("userAddress").innerText =
    "connected" + shortAddress(address);
  document.getElementById("connectMessage").style.display = "none";
  document.getElementById(tweetForm).style.display = "block";
}
