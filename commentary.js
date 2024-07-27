import { commentaryStyle, selectedVoice } from './game.js';

// Commentary
let commentaryElement, speechOutput;
let lastCommentaryTime = 0;
const COMMENTARY_COOLDOWN = 3000; // 3 seconds cooldown between comments
let isSpeaking = false;
let currentSpeechPriority = 0;

// Commentary priorities
const COMMENTARY_PRIORITY = {
    ALIEN_DESTROYED_NORMAL: 1,
    ALIEN_DESTROYED_TOUGH: 1,
    POWERUP_APPEAR: 3,
    POWERUP_COLLECT_RAPID_FIRE: 4,
    POWERUP_COLLECT_SHIELD: 4,
    POWERUP_DESTROYED: 5,
    LOSE_LIFE: 8,
    LEVEL_UP: 8,
    GAIN_LIFE: 8,
    GAME_START: 10,
    GAME_RESTART: 10,
    GAME_OVER: 10
};

function initCommentary() {
    commentaryElement = document.getElementById('commentary');
    speechOutput = document.getElementById('speech-output');
}

function updateCommentary(message, priority = 0, eventSpecification = '') {
    const currentTime = Date.now();
    const tookPriority = priority > currentSpeechPriority ? "Priority YES" : "Priority NO";
    
    if (currentTime - lastCommentaryTime >= COMMENTARY_COOLDOWN || priority > currentSpeechPriority) {
        const finalMessage = commentaryStyle === 'trashtalk' ? getTrashtalkMessage(eventSpecification) : message;
        commentaryElement.textContent = finalMessage;
        lastCommentaryTime = currentTime;
        
        // Log the commentary event
        console.log(`${new Date().toISOString()}, ${priority}, TTS NO, ${tookPriority}, ${eventSpecification}, "${finalMessage}"`);
        
        // Text-to-speech
        speakMessage(finalMessage, priority, eventSpecification);
    }
}

function speakMessage(message, priority, eventSpecification) {
    if ('speechSynthesis' in window) {
        const tookPriority = priority >= currentSpeechPriority ? "Priority YES" : "Priority NO";
        
        if (priority > currentSpeechPriority) {
            speechSynthesis.cancel(); // Stop any ongoing speech
            isSpeaking = false;
            
            isSpeaking = true;
            currentSpeechPriority = priority;
            const utterance = new SpeechSynthesisUtterance(message);
            
            // Choose a voice based on the selected option
            const voices = speechSynthesis.getVoices();
            if (voices.length > 0) {
                if (selectedVoice === 'random') {
                    utterance.voice = voices[Math.floor(Math.random() * voices.length)];
                } else {
                    utterance.voice = voices[parseInt(selectedVoice)];
                }
            }
            
            utterance.onend = () => {
                isSpeaking = false;
                currentSpeechPriority = 0;
            };
            speechSynthesis.speak(utterance);
            
            // Log the TTS event
            console.log(`${new Date().toISOString()}, ${priority}, TTS YES, ${tookPriority}, ${eventSpecification}, "${message}", Voice: ${utterance.voice ? utterance.voice.name : 'Default'}`);
        }
    }
}

function getTrashtalkMessage(eventSpecification) {
    const trashTalkMessages = {
        GAME_START: ["Oh look, another human thinks they can beat us. How cute!", "Ready to lose, Earthling?", "Prepare for humiliation, puny human!"],
        GAME_OVER: ["Game over already? I was just warming up!", "Back to your mom's basement, loser!", "Did you even try? Pathetic!"],
        GAME_RESTART: ["Back for more punishment? I admire your masochism!", "Round 2 of your embarrassment begins now!", "Let's see how quickly you fail this time!"],
        LOSE_LIFE: ["Oops! Did that hurt? Too bad!", "One step closer to total failure!", "Your ship looks better with some holes in it!"],
        POWERUP_APPEAR: ["A power-up! Too bad you're too slow to get it!", "Oh look, false hope has appeared!", "Here's something you'll never reach!"],
        POWERUP_COLLECT_RAPID_FIRE: ["Rapid fire? More like rapid failure!", "Great, now you can miss us faster!", "Ooh, scary! ...Not."],
        POWERUP_COLLECT_SHIELD: ["Hide behind that shield, coward!", "A shield won't save you from inevitable doom!", "Prolonging the inevitable, are we?"],
        ALIEN_DESTROYED_NORMAL: [
            "You got lucky, punk!",
            "One down, still no chance of winning!",
            "Enjoy that small victory. It's all you'll get!",
            "Wow, you actually hit something. Impressive... for a human.",
            "Don't celebrate yet, there's plenty more where that came from!",
            "Oh no, you destroyed our weakest alien. Whatever shall we do?",
            "Great job! You're still losing, but great job!",
            "One less alien? Big deal. We have an infinite supply!",
            "Congrats on your participation trophy!",
            "Did you close your eyes for that shot? Because it looked like it.",
            "Even a broken clock is right twice a day, I guess.",
            "Ooh, you're really scaring us now. Not!",
            "Was that your best shot? Please say no.",
            "You call that a kill? I've seen better shots in a flu vaccine.",
            "Wow, you destroyed our intern on their first day. How does it feel to crush dreams?",
            "One down, a million to go. You've got this! (Not really)",
            "Oh no, you've slightly inconvenienced us. Whatever shall we do?",
            "Congratulations! You've won... absolutely nothing.",
            "Great shot! Said no one, ever.",
            "You're really making a dent in our infinite army. Keep it up, champ!"
        ],
        ALIEN_DESTROYED_TOUGH: [
            "Oh no, you destroyed our tough alien! ...Said no one ever.",
            "Congrats, you've achieved the bare minimum!",
            "Don't get cocky, that was our intern!",
            "Wow, you actually took down a tough one. Did someone hack for you?",
            "One tough alien down, a million more to go. Feeling tired yet?",
            "Great, you killed our bodybuilder alien. Now who's going to spot us?",
            "Impressive. Most impressive. But you are not a Jedi yet.",
            "You took down our tough guy? Must've been his day off.",
            "Congratulations on beating the tutorial boss!",
            "That was our tough alien? Remind me to fire our recruitment team.",
            "Okay, okay, you got one. Want a medal or a chest to pin it on?",
            "Wow, you're stronger than you look! Still pathetically weak, though.",
            "That tough alien had a family, you monster! Just kidding, we're all soulless.",
            "You may have won the battle, but you're still losing the war, human!",
            "I bet you feel real proud of yourself now, huh? Enjoy it while it lasts.",
            "Great job! You've unlocked achievement: 'False Hope'!",
            "Oh no, our slightly-harder-to-kill alien! However will we recover?",
            "Congrats! You've graduated from 'totally useless' to 'mostly useless'!",
            "Impressive. Now do that a million more times and you might have a chance.",
            "You actually did it! Now face the wrath of our slightly tougher aliens!"
        ],
        LEVEL_UP: ["Higher level, higher failure rate for you!", "Ooh, things are getting serious now... Not!", "Ready for more embarrassment?"],
        GAIN_LIFE: ["Another life? Prolonging your suffering, I see.", "Great, more chances for us to destroy you!", "Oh good, I was worried we'd run out of lives to take!"],
        POWERUP_DESTROYED: ["Nice shot! ...On your own power-up, idiot!", "Destroying your own power-ups now? Clever strategy!", "Thanks for making our job easier!"]
    };

    const messages = trashTalkMessages[eventSpecification] || ["Wow, you're still playing? Impressive dedication to failure!"];
    return messages[Math.floor(Math.random() * messages.length)];
}

export { initCommentary, updateCommentary, COMMENTARY_PRIORITY };
