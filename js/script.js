console.log('Lets write JavaScript');
let currentSong = new Audio();
let songs;
let currFolder;

function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;
}

async function getSongs(folder) {
    currFolder = folder;
    let a = await fetch(`/${folder}/`)
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let as = div.getElementsByTagName("a");
    songs = [];
    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        if (element.href.endsWith(".mp3")) {
            songs.push(element.href.split(`/${folder}/`)[1]);
        }
    }

    //show all the songs in the playlist
    let songUL = document.querySelector(".songList").getElementsByTagName("ul")[0];
    songUL.innerHTML = "";
    for (const song of songs) {
        songUL.innerHTML = songUL.innerHTML + `<li><img class="invert" src="img/music.svg" alt="">
                            <div class="info">
                                <div> ${song.replaceAll("%20", " ")}</div>
                                <div>Shreya</div>
                            </div>
                            <div class="playnow">
                                <span>Play Now</span>
                                <img class="invert" src="img/play.svg" alt="">
                            </div></li>`;
    }

    //Attach event listeners to each songs in the song list
    Array.from(document.querySelector(".songList").getElementsByTagName("li")).forEach(e => {
        e.addEventListener("click", element => {
            playMusic(e.querySelector(".info").firstElementChild.innerHTML.trim());
        })

    })

    //listen for timeupdate event
    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerHTML = `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`;
        document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
    })

    //Add an event eventlistener to seekbar
    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentSong.currentTime = ((currentSong.duration) * percent) / 100;
    })
    
    //Add an event listener for previous button
    previous.addEventListener("click", () => {
        currentSong.pause();
        console.log("Previous clicked")
        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
        if ((index - 1) >= 0) {
            playMusic(songs[index - 1]);
        }
    })

    //Add an event listener for next button
    next.addEventListener("click", () => {
        currentSong.pause();
        console.log("Next clicked")

        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
        if ((index + 1) < songs.length) {
            playMusic(songs[index + 1]);
        }
    })

    //Add an event to volume
    document.querySelector(".range").getElementsByTagName("input")[0].addEventListener("change", (e) => {
        console.log("setting volume to", e.target.value, "/100");
        currentSong.volume = parseInt(e.target.value) / 100;
        if (currentSong.volume > 0) {
            document.querySelector(".volume>img").src = document.querySelector(".volume>img").src.replace("img/mute.svg", "img/volume.svg")
        }
    })

    //Add an event listener to mute the track
    document.querySelector(".volume>img").addEventListener("click", e => {
        if (e.target.src.includes("img/volume.svg")) {
            e.target.src = e.target.src.replace("img/volume.svg", "img/mute.svg");
            currentSong.volume = 0;
            document.querySelector(".range").getElementsByTagName("input")[0].value = 0;
        }

        else {
            e.target.src = e.target.src.replace("img/mute.svg", "img/volume.svg");
            currentSong.volume = .10;
            document.querySelector(".range").getElementsByTagName("input")[0].value = 10;
        }
    })

    return songs;
}

const playMusic = (track, pause = false) => {
    currentSong.pause(); // Always pause before changing src
    currentSong.src = `${currFolder}/${track}`;
    if (!pause) {
        currentSong.oncanplay = () => {
            currentSong.play();
            play.src = "img/pause.svg";
            currentSong.oncanplay = null; // Remove handler after playing
        };
    }
    document.querySelector(".songinfo").innerHTML = decodeURI(track);
    document.querySelector(".songtime").innerHTML = `00:00 / 00:00`;
}



async function displayAlbums() {
    console.log("displaying albums")
    let a = await fetch(`/songs/`)
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let anchors = div.getElementsByTagName("a");
    let cardContainer = document.querySelector(".cardContainer");
    let array = Array.from(anchors)
    cardContainer.innerHTML = "";
    for (let index = 0; index < array.length; index++) {
        const e = array[index];
        if (e.href.includes("/songs") && !e.href.includes(".htaccess")) {
            // Use regex to reliably extract folder name after /songs/
            let match = e.href.match(/\/songs\/([^\/]+)\/?$/);
            let folder = match ? match[1] : null;
            if (!folder) continue;
            // Try to fetch info.json, handle errors gracefully
            let title = folder;
            let description = "No description available.";
            try {
                let a = await fetch(`/songs/${folder}/info.json`);
                if (a.ok) {
                    let response = await a.json();
                    title = response.title || folder;
                    // title = decodeURIComponent(title);
                    description = response.description || description;
                }
            } catch (err) {
                // If info.json is missing or invalid, use defaults
                console.warn(`Could not load info.json for ${folder}:`, err);
            }
            cardContainer.innerHTML += `
            <div data-folder="${folder}" class="card">
            <div class="play">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                xlmns="http://www.w3.org/2000/svg">
                                <path d="M5 20V4L19 12L5 20Z" fill="#000" stroke="#141B34" stroke-width="1.5"
                                    stroke-linejoin="round" />
                            </svg>
                        </div>
                        <img src="/songs/${folder}/cover.jpg" alt="">
                        <h2>${title}</h2>
                        <p>${description}</p>
                    </div>`
        }
    }

    //Load the playlist whenever card is clicked
    Array.from(document.getElementsByClassName("card")).forEach(e => {
        e.addEventListener("click", async item => {
            console.log("Fetching songs")
            songs = await getSongs(`songs/${item.currentTarget.dataset.folder}`);
            // playMusic(songs[0])

        })
    })

}

async function main() {
    //Get the list of all the songs
    await getSongs("songs/Relax");
    playMusic(songs[0], true);

    // Display all the albums on the page
    await displayAlbums()

    //Attach event listeners to play, next, previous buttons
    play.addEventListener("click", () => {
        if (currentSong.paused) {
            // If audio is not ready, wait for canplay
            if (currentSong.readyState < 2) {
                currentSong.oncanplay = () => {
                    currentSong.play();
                    play.src = "img/pause.svg";
                    currentSong.oncanplay = null;
                };
            } else {
                currentSong.play();
                play.src = "img/pause.svg";
            }
        } else {
            currentSong.pause();
            play.src = "img/play.svg";
        }
    });
    
    //Add an event listner for hamburger
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    })

    //Add an event listner for close button
    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    })


}

main();