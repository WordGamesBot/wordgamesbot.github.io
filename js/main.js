let word_length = 5;
let answerlist = "wordlebot_answers";
let guesslist = "guesslist_wordle_guesses";
let difficulty = "easy";
let polygonle_expert = ((difficulty != "ultra") && (document.getElementById("expert")?.checked))? true: false;
let pairings = [];
let seconds = {};
let addendum = "";
let common, guessable, acceptable, bot;
let best_trees = {};

// word length constants
const SMALLEST_WORD = 3, LARGEST_WORD = 11, DEFAULT_LENGTH = 5;
// class constants to assign colors to tiles
const CORRECT = "G", INCORRECT = "B", WRONG_SPOT = "Y", EMPTY = "X";
const NOT_YET_TESTED = .999, INFINITY = 9999999;
// list size constants

// const word_banks = {wordlebot_answers: "official_answers", wordlebot_answers_with_ed: "official_answers_with_ed", wordlebot_guesses: "official_guesses", wordle_guesses: "official_words", old_wordle_answers: "old_answers", restricted: "common_words", complete: "all_common_words", all_old: "big_list"};
// const dictionaries = {Wordle: "wordle_guesses"/*, Woodle: "big_list", W-Peaks: "big_list", Antiwordle: "big_list", Xordle: "big_list", Thirdle: "big_list", Fibble: "big_list", Hardle: "big_list", Dordle: "big_list", Quordle: "big_list", Octordle: "big_list", Warmle: "big_list", Spotle: , Polygonle: "big_list"*/};

const COLORS = [
	"black", "green", "blue", "red", "purple", "orange", "brown", "gray"
];
const NO_WORDS_LEFT_MESSAGE = "it doesn't look like we have this word. double check to make sure you all the clues you entered are correct.";

const LOCAL_VERSION = (window.location.protocol == "file:");
const FULL_TREES = (typeof best_trees_full != "undefined");
const SHORT_TREES = (typeof best_trees_short != "undefined");
const URLParams = new URLSearchParams(Array.from(new URLSearchParams(window.location.search), ([key, value]) => [key.toLowerCase(), value]));
const CHECK_SIZE = Number(URLParams.get("check")) || 50;
const MAX_TIME = Number(URLParams.get("time")) || 1000;
const MAXIMUM = Number(URLParams.get("max")) || 100000;
const LIST_LENGTH = Number(URLParams.get("list")) || 10;
const SIZE_FACTOR = Number(URLParams.get("size")) || 5;
const TEST_BOT_SIZE = Number(URLParams.get("bot_test")) || 500;
const DEBUG = URLParams.has("debug");
const PREVCALC = URLParams.has("prevcalc");
const USE_TREES = (!URLParams.has("no_tree")) || (!(FULL_TREES || SHORT_TREES));
// const HASH_TEST = URLParams.has("hash_test");

async function getJSON(path) {
	return await fetch(path).then((response)=>response.json()).then((responseJson)=>{return responseJson});
}

function setBotMode(type) {
	bot = new Bot(type);
	if ((difficulty == "hard") && (!bot.hasHardMode())) difficulty = "ultra";
	setMaxGuesses();
	localStorage.setItem("bot_type", type);

	pairings = [];
}

function setMaxGuesses() {
	if (!localStorage.getItem("guesses" + bot.type)) {
		if (bot.isFor(DORDLE)) {
			localStorage.setItem("guesses" + bot.type, 7);
		} else if (bot.isFor(WOODLE) || bot.isFor(HARDLE)) {
			localStorage.setItem("guesses" + bot.type, 8);
		} else if (bot.isFor(XORDLE) || bot.isFor(FIBBLE) || bot.isFor(QUORDLE)) {
			localStorage.setItem("guesses" + bot.type, 9);
		} else if (bot.isFor(OCTORDLE)) {
			localStorage.setItem("guesses" + bot.type, 13);
		}
	}
}

function setWordbank() {
	let current = word_length;
	word_length = Number(document.getElementById("word-length").value);

	document.getElementById("word-entered").setAttribute("maxlength", word_length);
	document.getElementById("word-known-answer").setAttribute("maxlength", word_length);
	// clearHTML(document.getElementById("next-previous-buttons"));

	let banks = document.getElementsByClassName("answerlist");

	for (let i = 0; i < banks.length; i++) {
		if (banks[i].id.includes("wordle")) banks[i].disabled = (word_length != 5);
	}

	for (let i = 0; i < banks.length; i++) {
		if (banks[i].checked == true) {
			answerlist = banks[i].id;
			break;
		}

		if (i == banks.length - 1) {
			document.getElementById(answerlist).checked = true;
		}
	}

	if ((word_length != 5) && answerlist.includes("wordle")) {
		answerlist = "restricted";
		document.getElementById(answerlist).checked = true;
	}

	banks = document.getElementsByClassName("guesslist");

	for (let i = 0; i < banks.length; i++) {
		if (banks[i].id.includes("wordle")) banks[i].disabled = (word_length != 5);
	}

	for (let i = 0; i < banks.length; i++) {
		if (banks[i].checked == true) {
			guesslist = banks[i].id;
			break;
		}

		if (i == banks.length - 1) {
			document.getElementById(guesslist).checked = true;
		}
	}

	if ((word_length != 5) && guesslist.includes("wordle")) {
		guesslist = "guesslist_all_old";
		document.getElementById(guesslist).checked = true;
	}
	let use_all_acceptable_checkbox = document.getElementById("use_all_acceptable_checkbox");

	switch (guesslist) {
		case "guesslist_restricted": {
			guessable = common_words.slice();
			use_all_acceptable_checkbox.disabled = false;
			break;
		}
		case "guesslist_complete": {
			guessable = all_common_words.slice();
			use_all_acceptable_checkbox.disabled = false;
			break;
		}
		case "guesslist_all_old": {
			guessable = big_list.slice();
			use_all_acceptable_checkbox.disabled = (word_length != 5);
			break;
		}
		case "guesslist_wordlebot_answers": {
			guessable = official_answers.slice();
			use_all_acceptable_checkbox.disabled = false;
			break;
		}
		case "guesslist_wordlebot_answers_with_ed": {
			guessable = official_answers_with_ed.slice();
			use_all_acceptable_checkbox.disabled = false;
			break;
		}
		case "guesslist_wordlebot_guesses": {
			guessable = official_guesses.slice();
			use_all_acceptable_checkbox.disabled = false;
			break;
		}
		case "guesslist_wordle_guesses": {
			guessable = official_words.slice();
			use_all_acceptable_checkbox.disabled = true;
			break;
		}
		case "guesslist_old_wordle_answers": {
			guessable = old_answers.slice();
			use_all_acceptable_checkbox.disabled = false;
			break;
		}
		default: {
			guessable = big_list.slice();
			use_all_acceptable_checkbox.disabled = (word_length != 5);
			break;
		}
	}
	// guessable = (eval(word_banks[(guesslist.slice(10))])?? big_list).slice();

	guessable = guessable.filter(a => a.length == word_length).sort();
	guessable = [...new Set(guessable)];

	if (!use_all_acceptable_checkbox?.disabled && use_all_acceptable_checkbox?.checked) {
		// switch (bot.type) {
			// case "Wordle": {
				if (word_length == 5) {
					acceptable = [...new Set(official_words.filter(a => a.length == word_length).sort())];
				} else {
					acceptable = [...new Set(big_list.filter(a => a.length == word_length).sort())];
				}
				// break;
			// }
			// default: {
				// acceptable = [...new Set(big_list.filter(a => a.length == word_length).sort())];
				// break;
			// }
		// }
	} else acceptable = guessable.slice();

	switch (answerlist) {
		case "restricted": {
			common = common_words.slice();
			break;
		}
		case "complete": {
			common = all_common_words.slice();
			break;
		}
		case "all_old": {
			common = big_list.slice();
			break;
		}
		case "wordlebot_answers": {
			common = official_answers.slice();
			break;
		}
		case "wordlebot_answers_with_ed": {
			common = official_answers_with_ed.slice();
			break;
		}
		case "wordlebot_guesses": {
			common = official_guesses.slice();
			break;
		}
		case "wordle_guesses": {
			common = official_words.slice();
			break;
		}
		case "old_wordle_answers": {
			common = old_answers.slice();
			break;
		}
		default: {
			common = common_words.slice();
			break;
		}
	}
	// common = (eval(word_banks[answerlist])?? common_words).slice();

	common = common.filter(a => a.length == word_length).sort();
	common = [...new Set(common)];

	if (current != word_length) {
		document.getElementById("word-known-answer").value = "";
		resetAnswers();
		clearPolygonle();
		clearGrids();
	}
	if (USE_TREES && !LOCAL_VERSION && !FULL_TREES) {
		for (const i of (new Set([difficulty, ...(bot.hasHardMode? ["easy", "hard", "ultra"]: ["easy", "ultra"])]))) {
			const settings = getSettingsHash(i, WORDLE, 6);
			if (!best_trees[settings]) {
				getJSON("./../WordLists/NYT/Trees/" + settings + ".json").then(json => best_trees[settings] = json);
			}
		}
	}
}

function getBestOf(list) {
	let best_list;

	if (list[bot.type]) {
		best_list = list[bot.type];
		let used_lists = answerlist+"|"+guesslist;
		best_list = best_list.filter(a => a[used_lists] != null);
		best_list = best_list.map(a => Object.assign({}, {word: a.word, average: a[used_lists].average, wrong: a[used_lists].wrong, wrong_answers: a[used_lists].wrong_answers}));
		return best_list;
	}

	list[bot.type] = [];
	return list[bot.type];
}

// gets all possible likely and unlikely answers left
// sorts the answer & potential guess list based on the most common letters
// gets the best guesses for normal and hard mode
// passes the data to update the list of suggestions and letters in the HTML
function update() {
	// difficulty = getDifficulty();
	let lists = getPotentialGuessesAndAnswers();
	let best_guesses = [];
	addendum = "";

	let old_guess_count = guessesMadeSoFar() - 1;
	if (old_guess_count >= 0) {
		let guess_stats;
		let old_guess_stats = guessesArePrecomputed(old_guess_count);
		let user_guess = getWord(old_guess_count);
		let old_list = getPotentialGuessesAndAnswers(old_guess_count);
		if (old_guess_stats) {
			guess_stats = old_guess_stats.filter(a => a.word == user_guess);
		}
		if (!guess_stats || (guess_stats.length == 0)) {
			if (USE_TREES) {
				guess_stats = getBestTree(old_guess_count, user_guess);
				guess_stats = guess_stats? [guess_stats]: [];
			}
			if (PREVCALC && (old_guess_count > 0) && (!guess_stats || (guess_stats.length == 0))) {
				if (DEBUG) console.log("calculating score for guess " + (old_guess_count+1) + ":" + user_guess);
				guess_stats = getBestGuesses(old_list, old_guess_count, false, [user_guess]);
				if (((difficulty == "easy") && guessable.includes(guess_stats[0].word)) || ((difficulty == "hard") && bot.hasHardMode && old_list.hard_guesses.includes(guess_stats[0].word)) || ((difficulty == "ultra") && old_list.all.includes(guess_stats[0].word))) {
					if (old_guess_stats) {
						old_guess_stats.push(guess_stats[0]);
						old_guess_stats = sortByWrongThenAverage(old_guess_stats, old_list.all);
						setBestGuesses(old_guess_stats, old_guess_count);
					// } else {
						// setBestGuesses(guess_stats, old_guess_count);
					}
				}
			}
		}
		if (guess_stats && (guess_stats.length > 0)) {
			if (notFullyTested(guess_stats[0])) {
				if (PREVCALC) {
					addendum = "Your score for the guess " + guess_stats[0].word + " was not fully tested.<br>";
				}
			} else {
				addendum = "Your score for the guess " + guess_stats[0].word + " was " + getDataFor(guess_stats[0], old_list.unique) + ".<br>";
				if (guess_stats[0].wrong_answers && (guess_stats[0].wrong_answers.length > 0)) {
					addendum += "Might lose on: " + guess_stats[0].wrong_answers.join(", ") +  ".<br>";
					// for (let i = 0; i < guess_stats[0].wrong_answers.length; i++) {
						// addendum += (i ? ", ": "") + guess_stats[0].wrong_answers[i];
					// }
					// addendum += ".<br>";
				}
			}
		}
	}

	if (!timeToShowFinalOptions(lists.unique)) {
		best_guesses = getBestGuesses(lists);
		best_guesses = removeUsedGuesses(best_guesses);
	}

	updateLists(lists, best_guesses);
}

function removeUsedGuesses(list, guess_count = guessesMadeSoFar()) {
	for (let i = 0; i < guess_count; i++) {
		list = list.filter(function(a) { return a.word !== getWord(i); });
	}

	return list;
}

function uniqueWordsFrom(list) {
	if (!list.length) return [];

	if (typeof list[0] == "object") {
		let unique = [];
		for (let i = 0; i < list.length; i++) {
			unique = combineLists(unique, Object.values(list[i]));
		}

		return [... new Set(unique)];
	} else return [... new Set(list)];
}

function separateListByLikelihood(list) {
	let likely = [];
	let unlikely = [];

	for (let i = 0; i < list.length; i++) {
		if (Array.isArray(list[i])) {
			let new_lists = separateListByLikelihood(list[i]);
			likely.push(new_lists.likely);
			unlikely.push(new_lists.unlikely);
		} else if (bot.isLikely(list[i]) && bot.isGuessable(list[i])) {
			likely.push(list[i]);
		} else {
			unlikely.push(list[i]);
		}
	}

	return {likely: likely, unlikely: unlikely};
}

function getPotentialGuessesAndAnswers(guess_count) {
	let all_possible_answers = bot.getAllPossibleAnswersFrom(acceptable.slice(), guess_count);
	let separated_lists = separateListByLikelihood(all_possible_answers);
	let answer_list = separated_lists.likely;
	let unlikely_answers = separated_lists.unlikely;
	let hard_guesses = ((difficulty != "ultra") && bot.hasHardMode())? filterList(((polygonle_expert)? polygonleFilter(guessable.slice()): guessable.slice()), false, false, false, false, guess_count): [];
	let unique_answers = uniqueWordsFrom(answer_list);
	all_possible_answers = uniqueWordsFrom(all_possible_answers).filter((a) => guessable.includes(a));

	if ((!bot.isFor(ANTI)) && ((unique_answers.length <= 2) || (guess_count == 0))) {
		return {
				hard_guesses: hard_guesses,
				guesses: unique_answers,
				answers: answer_list,
				unique: unique_answers,
				all: all_possible_answers,
				unlikely: unlikely_answers,
			};
	}

	let alphabet = bot.getBestLetters(unique_answers);
	let sorted_answer_list = sortList(unique_answers, alphabet);
	let sorted_guess_list = initialGuesses(sorted_answer_list, ((bot.hasHardMode() && (difficulty == "hard"))? hard_guesses: all_possible_answers), alphabet);

	return {
			hard_guesses: hard_guesses,
			guesses: sorted_guess_list,
			answers: answer_list,
			unique: sorted_answer_list,
			all: all_possible_answers,
			unlikely: unlikely_answers,
		};
}

function initialGuesses(sorted_answer_list, all_possible_words, alphabet) {
	let sorted_guess_list;

	if ((sorted_answer_list.length <= 2) && !bot.isFor(ANTI)) {
		sorted_guess_list = sorted_answer_list.slice();
	} else {
		if (difficulty == "easy") {
			if (bot.isFor(THIRDLE)) {
				sorted_guess_list = allCombinations("", []);
			} else {
				sorted_guess_list = guessable.slice();
				if (polygonle_expert) {
					sorted_guess_list = polygonleFilter(sorted_guess_list);
				} else if (bot.isFor(ANTI)) {
					sorted_guess_list = filterList(sorted_guess_list, false, true);
				}
			}
		} else {
			sorted_guess_list = all_possible_words.slice();
		}
	}

	sorted_guess_list = sortList(sorted_guess_list, alphabet);

	if (!bot.isFor(ANTI)) {
		sorted_guess_list = combineLists(sorted_answer_list, sorted_guess_list);
	}

	sorted_guess_list = reduceListSize(sorted_guess_list, sorted_answer_list);

	return sorted_guess_list;
}

function polygonleFilter(sorted_guess_list) {
	let new_list = [];
	const polygonle_pattern = getPolygonlePattern();
	for (const this_word of sorted_guess_list) {
		let matched = true;
		let pattern_letters = [];
		let index = 0;
		for (const pattern of polygonle_pattern) {
			if (pattern_letters[pattern]) {
				if (this_word[index] != pattern_letters[pattern]) {
					matched = false;
					break;
				}
			} else {
				if (pattern_letters.includes(this_word[index])) {
					matched = false;
					break;
				} else {
					pattern_letters[pattern] = this_word[index];
				}
			}
			index++;
		}
		if (matched) {
			new_list.push(this_word);
		}
	}
	// let pattern = [];
	// let pattern_matches = [];
	// let index = 0;
	// for (const polygonle_tile of document.getElementById("polygonle-grid")?.children) {
		// pattern[index] = polygonle_tile.classList[1];
		// if (pattern_matches[polygonle_tile.classList[1]] !== undefined) {
			// pattern_matches[polygonle_tile.classList[1]].push(index);
		// } else {
			// pattern_matches[polygonle_tile.classList[1]] = [index];
		// }
		// index++;
	// }
	// for (let i = 0; i < sorted_guess_list.length; i++) {
		// let this_word = sorted_guess_list[i];
		// let matched = true;
		// for (let j = 0; j < this_word.length; j++) {
			// let pattern_key = pattern[j];
			// let pattern_val = pattern_matches[pattern_key];
			// for (let k = 0; k < pattern_val.length; k++) {
				// if (this_word[j] != this_word[pattern_val[k]]) {
					// matched = false;
					// break;
				// }
			// }
			// if (!matched) break;
			// let current_char = this_word[j];
			// for (let k = 0; k < this_word.length; k++) {
				// if (!pattern_val.includes(k) && j != k) {
					// if (current_char == this_word[k]) {
						// matched = false;
						// break;
					// }
				// }
			// }
		// }
		// if (matched) {
			// new_list.push(this_word);
		// }
	// }
	return new_list;
}

// function twoAnswersLeft(answers) {
	// if (bot.getCount() == 1) {
		// return answers.length <= 2;
	// }

	// return uniqueWordsFrom(answers).length <= 2;
// }

function getUnfoundAnswers(answer_lists) {
	unfound_answers = [];

	for (let i = 0; i < answer_lists.length; i++) {
		if (answer_lists[i].length == 1) {
			unfound_answers.push(answer_lists[i][0]);
		}
	}


	for (let i = 0; i < guessesMadeSoFar(); i++) {
		let colors = bot.getRowColor(i);

		if (colors.includes(CORRECT.repeat(word_length))) {
			let pos = unfound_answers.indexOf(getWord(i));

			if (pos != -1) {
				unfound_answers.splice(pos, 1);
			}
		}
	}


	return unfound_answers;
}

function allCombinations(string, list) {
	if (string.length == word_length) {
		list.push(string);
	} else {
		for (let c = 65; c <= 90; c++) {
			allCombinations(string + String.fromCharCode(c), list);
		}
	}

	return list;
}

// creates the suggetsions for both normal and hard mode
// updates the headers to reflect how many words are left
// adds those suggestions to the respective slides
// creates a dropdown list showing all possible words
function updateLists(lists, best_guesses) {
	let guess_list = writeBestGuessList(best_guesses, lists);

	updateHeaders(lists);
	addToSlides(addendum + "<u>Your best possible guesses are:</u>", guess_list);

	if (isEmpty(lists.all)) {
		return addToSlides(addendum, noWordsLeftMessage());
	}

	if (timeToShowFinalOptions(lists.answers)) {
		// will only show the final two options as suggestions
		// ie: 'its either 'THIS' or 'THAT'
		return showFinalOptions(lists.answers, lists.unlikely);
	}

	let unfound_answers = getUnfoundAnswers(lists.answers);
	if (unfound_answers.length) {
		addToSlides(addendum, unfoundAnswersMessage(unfound_answers));
	}
}

function timeToShowFinalOptions(answers) {
	return bot.getAnswerListLength(answers) <= 2 && !bot.isFor(ANTI);
}

// creates and returns the top 10 list of suggestions
// suggestions will then be added to the HTLM of either the suggestions
// for hard mode or normal mode
function writeBestGuessList(guesses, lists) {
	let data;
	let list = [];
	let list_length = Math.min(guesses.length, LIST_LENGTH);

	for (let i = 0; i < list_length; i++) {
		data = "not fully tested";
		if (!notFullyTested(guesses[i])) {
			data = getDataFor(guesses[i], lists.unique);
		}
		let color = "click";
		if (lists.all.includes(guesses[i].word)) color += " ultra_suggestion";
		else if (lists.hard_guesses.includes(guesses[i].word)) color += " hard_suggestion";
			
		if (common.includes(guesses[i].word)) color += " likely_suggestion";
		let list_item = createListItem(guesses[i].word, data, i+1, color, guesses[i].wrong_answers);
		list.push(list_item);
	}

	return list;
}

function getDataFor(guess, answers) {
	if ((guess.wrong === undefined) && (guess.wrong_answers === undefined)) {
		return (guess.average/answers.length).toFixed(3) + " guesses left";
	}

	if (guess.wrong > 0) {
		return /*"≥" + */decimalToPercent(1-guess.wrong) + " solve rate";
	}

	if (guess.wrong == 0) {
		return /*"≥" + */guess.average.toFixed(3) + " guesses left";
	}

	if (guess.wrong_answers.length > 0) {
		return "≥" + decimalToPercent(1-(guess.wrong_answers.length/answers.length)) + " solve rate";
	}

	// if (!guessesMadeSoFar(0)) {
		// return num_guesses + " guesses";
	// }

	return ((guess.average <= (answers.length * 2 + (!answers.includes(guess.word))))? "": "≤") + (guess.average/answers.length).toFixed(3) + " guesses left";
}

function notFullyTested(guess) {
	return !bot.hasScore() || guess.wrong == NOT_YET_TESTED;
}

function createListItem(word, data, rank, color, wrong_answers = "") {
	color ??= (common.includes(word))? "click likely_suggestion": "click";
	let suggestion = createElement("span", word, color);
	let word_with_ranking = createElement("div", rank + ". " + suggestion.outerHTML, "suggestion");
	let score, wrong_answers_div;
	if (wrong_answers.length == 0) {
		score = createElement("div", data, "score");
	} else {
		score = createElement("div", data, "losingscore");
		wrong_answers_div = createElement("div", "", "visible");
		wrong_answers_div.style.display = "none";
		for (let i = 0; i < wrong_answers.length; i++) {
			addWordsToDiv(wrong_answers[i], wrong_answers_div, "black");
		}
		score.prepend(wrong_answers_div);
	}
	
	let list_item = createElement("li", word_with_ranking.outerHTML + score.outerHTML);
	return list_item;
}

function updateHeaders(lists) {
	let heading = document.getElementsByClassName("possibilities total")[0];
	let subheading = document.getElementsByClassName("possibilities separated")[0];
	let likely_length = bot.getAnswerListLength(lists.answers);
	let unlikely_length = bot.getAnswerListLength(lists.unlikely);
	if (difficulty == "easy") {
		let total_length = likely_length + bot.getAnswerListLength(lists.unlikely.filter((a) => bot.isGuessable(a)));
		heading.innerHTML = total_length + " possibilit" + pluralOrSingle(total_length, "y", "ies");
	} else {
		if ((difficulty == "hard") && bot.hasHardMode()) {
			let total_length = lists.hard_guesses.length;
			let hard_guesses_html = total_length + " guess" + pluralOrSingle(total_length, "", "es");
			let only_hard_guesses = lists.hard_guesses.filter((a) => !lists.all.includes(a));
			let hard_guesses_span;
			if (only_hard_guesses.length < 1000) {
				hard_guesses_span = createElement("span", hard_guesses_html, "showlist");
				let hard_guesses_div = createElement("div", "", "visible");
				hard_guesses_div.style.display = "none";
				if (only_hard_guesses.length > 0) {
					for (let i = 0; i < only_hard_guesses.length; i++) {
						addWordsToDiv(only_hard_guesses[i], hard_guesses_div, bot.getCount() > 1 ? COLORS[i] : "black");
					}
				} else {
					setHTML(hard_guesses_div, "goose egg");
				}
				hard_guesses_span.prepend(hard_guesses_div);
			} else {
				hard_guesses_span = createElement("span", hard_guesses_html, "");
			}
			heading.innerHTML = hard_guesses_span.outerHTML;
		} else {
			let total_length = lists.all.length;
			heading.innerHTML = total_length + " guess" + pluralOrSingle(total_length, "", "es");
		}
	}
	let likely_html = likely_length + " probable answer" + pluralOrSingle(likely_length, "", "s");
	let unlikely_html = unlikely_length + " unlikely possibilit" + pluralOrSingle(unlikely_length, "y", "ies");
	let likely_span, unlikely_span;

	// if (guessesMadeSoFar() > 0) {
	if (likely_length < 4000) {
		// creates a dropdown of all possible words left
		// dropdown is viewable if you click on the section that lists
		// how many likely/unlikely answers are remaining
		likely_span = createElement("span", likely_html, "showlist");
		let potential_answers = createElement("div", "", "visible");
		potential_answers.style.display = "none";

		if (likely_length > 0) {
			for (let i = 0; i < lists.answers.length; i++) {
				addWordsToDiv(lists.answers[i], potential_answers, bot.getCount() > 1 ? COLORS[i] : "black");
			}
		} else {
			setHTML(potential_answers, "goose egg");
		}

		likely_span.prepend(potential_answers);
	} else {
		likely_span = createElement("span", likely_html, "");
	}

	if (unlikely_length < 1000) {
		unlikely_span = createElement("span", unlikely_html, "showlist");
		let technically_words = createElement("div", "", "visible");
		technically_words.style.display = "none";
		if (unlikely_length > 0) {
			for (let i = 0; i < lists.unlikely.length; i++) {
				addWordsToDiv(lists.unlikely[i], technically_words, bot.getCount() > 1 ? COLORS[i] : "black");
			}
		} else {
			setHTML(technically_words, "goose egg");
		}
		unlikely_span.prepend(technically_words);
	} else {
		unlikely_span = createElement("span", unlikely_html, "");
	}
	subheading.innerHTML = likely_span.outerHTML + ", " + unlikely_span.outerHTML + ".";
}

function addWordsToDiv(words, div, color) {
	if (Array.isArray(words)) {
		for (let i = 0; i < words.length; i++) {
			addWordsToDiv(words[i], div, color);
		}
	} else {
		let answer = createElement("p", printAnswer(words), color);
		div.append(answer);
	}
}

function noWordsLeftMessage() {
	let message = createElement("div", NO_WORDS_LEFT_MESSAGE, "", "nowords");
	return [message];
}

function unfoundAnswersMessage(unfound_answers) {
	let text = unfound_answers.length + " of the answers " + pluralOrSingle(unfound_answers.length, "is ", "are ");

	for (let i = 0; i < unfound_answers.length; i++) {
		let answer = createElement("span", printAnswer(unfound_answers[i]), "final");
		text += answer.outerHTML;

		if (i == unfound_answers.length-1) {
			text += ".";
		} else if (i == unfound_answers.length-2) {
			text += ", and ";
		} else {
			text += ", ";
		}
	}

	let message = createElement("div", text, "multi-answer");
	return [message];
}

// only called if there are less than two likely answers left
// shows: almost certainly 'THIS' or 'THAT'
// unlikely but it could be: 'SOMETHING', 'ELSE'
function showFinalOptions(sorted, less_likely) {
	let all_suggestions = [];

	if (bot.getCount() > 1) {
		sorted = uniqueWordsFrom(sorted);
		less_likely = uniqueWordsFrom(less_likely);
	}
	less_likely = less_likely.filter((a) => guessable.includes(a));

	if (bot.getAnswerListLength(sorted)) {
		let final_words = createElement("li", "", "likely");
		let first_answer = createElement("span", printAnswer(sorted[0]), "final");
		final_words.innerHTML = "The word is almost certainly " + first_answer.outerHTML;

		if (sorted.length == 2) {
			let second_answer = createElement("span", printAnswer(sorted[1]), "final");
			final_words.innerHTML += " or " + second_answer.outerHTML;
		}

		final_words.innerHTML += ".";
		all_suggestions.push(final_words);
	}

	if (bot.getAnswerListLength(less_likely)) {
		let unlikely = createElement("li", "Unlikely, but it might be ", "others");

		for (let i = 0; i < less_likely.length; i++) {
			let unlikely_answer = createElement("span", printAnswer(less_likely[i]), "final");
			unlikely.innerHTML += unlikely_answer.outerHTML;

			(i < less_likely.length - 1) ? unlikely.innerHTML += ", " : unlikely.innerHTML += ".";
		}

		all_suggestions.push(unlikely);
	}

	addToSlides(addendum, all_suggestions);
}

function printAnswer(answer, style = "") {
	if (typeof answer == "string") {
		return createElement("span", answer, "click" + (bot.isGuessable(answer)? "": " unguessable")).outerHTML;
	}

	if (Array.isArray(answer) && answer.length) {
		return printAnswer(answer[0]);
	}

	if (typeof answer == "object" && bot.isFor(XORDLE)) {
		return printAnswer(answer.word1) + "/" + printAnswer(answer.word2);
	}
}

// adds the heading, normal suggestsions, and hard suggestions
// to the respective HTML element
function addToSlides(heading_html, suggestions) {
	let header = document.getElementsByClassName("mini-title")[0];
	let list = document.getElementsByClassName("best-guesses")[0].getElementsByTagName("ul")[0];

	setHTML(header, heading_html);
	clearHTML(list);

	suggestions.forEach(function(a) {
		list.append(a);
	});
}

// returns the number of guesses made to far
function guessesMadeSoFar() {
	if (bot.isFor(SPOTLE)) {
		return spotleGuesses();
	}

	return Math.ceil(document.getElementsByClassName("row").length/bot.getCount());
}

function spotleGuesses() {
	let rows = document.getElementsByClassName("row");
	let count = 0;

	for (let i = 0; i < rows.length; i++) {
		let tiles = rows[i].getElementsByClassName("tile");

		if (tiles[0].innerHTML == " ") {
			return count;
		}

		count++;
	}

	return count;
}

// checks if we're playing on hard mode or normal mode
// function getDifficulty() {
	// return document.querySelector(`input[type="radio"][name="mode-switcher"]:checked`).id;
// }

function botIsOn() {
	return document.getElementById("results");
}

/*
	TABLE FUNCTIONS
	creates the rows of guesses & buttons
	modifies the tiles/buttons when clicked
	accesses information about the guesses/current state
*/
function makeTables(val, c) {
	if (c == null) c = "normal";
	let grids = document.getElementsByClassName("grid");

	if (val) {
		if (bot.getCount() > 1) {
			let need_update = true;
			for (let i = 0; i < bot.getCount(); i++) {
				let row = createRow(val, c);
				grids[i].append(row);
				bot.setChangeEvents(row);
				let bot_answer = bot.answers[i];
				if (bot_answer && bot_answer?.length == word_length) {
					bot.setRowColor(bot.getDifference(val, bot_answer), row);
				} else {
					need_update = false;
				}
			}
			if (need_update) update();
		} else {
			if (bot.isFor(SPOTLE) && guessesMadeSoFar() < 6 && val != " ".repeat(word_length)) {
				let row = document.getElementsByClassName("row")[guessesMadeSoFar()];
				let tiles = row.getElementsByClassName("tile");
				let color;
				let bot_answer = bot.answers[0];
				if (bot_answer && bot_answer?.length == word_length) {
					color = bot.getDifference(val, bot_answer);
				}

				for (let i = 0; i < tiles.length; i++) {
					tiles[i].innerHTML = val.charAt(i);
					if (color) tiles[i].classList.replace(INCORRECT, color[i]);
				}
				if (color) update();
			} else {
				let row = createRow(val, c);
				grids[0].append(row);
				bot.setChangeEvents(row);
				if (bot.type == XORDLE) {
					let bot_answer;
					if (bot.answers[0]?.length == word_length) {
						bot_answer = bot.answers[0];
					}
					if (bot.answers[1]?.length == word_length) {
						if (bot_answer) {
							bot_answer = {word1: bot_answer, word2: bot.answers[1]};
						} else {
							bot_answer = bot.answers[1];
						}
					}
					if (bot_answer) {
						bot.setRowColor(bot.getDifference(val, bot_answer), row);
						if (typeof bot_answer == "object") update();
					}
				} else {
					let bot_answer = bot.answers[0];
					if (bot_answer && bot_answer.length == word_length) {
						bot.setRowColor(bot.getDifference(val, bot_answer), row);
						if (bot.type != "Fibble") update();
					}
				}
			}
		}
	}

	if ((guessesMadeSoFar() == 1 && c == "normal") || bot.isFor(SPOTLE)) {
		addButtons();
		let full_grid = document.getElementById("hints");
		full_grid.classList.remove("empty");
	}

	document.getElementById("word-entered").value = "";
}

function createRow(word, mode) {
	let row = createElement("div", "", "row " + mode + " " + bot.type);

	for (let i = 0; i < word.length; i++) {
		let button = createElement("button", word.charAt(i), "B tile " + bot.type);
		if (word_length > 10) button.style.fontSize = "1rem";
		row.append(button);
	}

	if (bot.isFor(WOODLE)) {
		row.append(makeWoodleDropdowns());
	}

	return row;
}

function makeWoodleDropdowns() {
	let container = createElement("div", "", "tracker");
	let correct_count = createElement("select", "", "woodle-count " + CORRECT);
	let wrong_spot_count = createElement("select", "", "woodle-count " + WRONG_SPOT);

	container.append(correct_count);
	container.append(wrong_spot_count);

	return container;
}

function addButtons() {
	let undo = createElement("button", "remove last guess", "undo");
	let filter = createElement("button", "calculate next guess", "filter");
	let button_container = document.getElementById("next-previous-buttons");

	clearHTML(button_container);
	button_container.append(undo);
	button_container.append(filter);

	filter.addEventListener("click", function() {
		update();
	});

	undo.addEventListener("click", function() {
		removeLastRow();
		update();
	});
}

function removeLastRow() {
	let grids = document.getElementsByClassName("grid");

	for (let i = 0; i < grids.length; i++) {
		let rows = grids[i].getElementsByClassName("row");
		remove(rows[guessesMadeSoFar()-1]);
		// rows[rows.length-1].remove();

		// if (!rows.length) {
		if (guessesMadeSoFar() == 0) {
			// clearHTML(document.getElementById("next-previous-buttons"));
			// let full_grid = document.getElementById("hints");

			// if (!bot.isFor(SPOTLE)) {
			//	 full_grid.classList.add("empty");
			// }

			if (!bot.isFor(SPOTLE)) {
				resetPage();
			} else {
				addFinalizeGridButton();
			}
		}
	}
}

function remove(row) {
	if (bot.isFor(SPOTLE) && guessesMadeSoFar() <= 6) {
		let tiles = row.getElementsByClassName("tile");

		for (let i = 0; i < tiles.length; i++) {
			tiles[i].innerHTML = " ";

			let old_color = getTileColor(tiles[i]);
			if (old_color != EMPTY) {
				tiles[i].classList.replace(old_color, INCORRECT);
			}
		}
	}

	else row.remove();
}

function getWord(number) {
	let row = document.getElementsByClassName("row")[number];
	let tiles = row.getElementsByClassName("tile");

	let guess = "";

	for (let i = 0; i < word_length; i++) {
		guess += tiles[i].innerHTML;
	}

	return guess;
}


/*
	GUESS FUNCTIONS
	calculates the best guess at any given turn
	accesses guesses that are predetermined
	sets new guesses to memory
	finds the color difference between two words
*/
function makeGuessHash(guess_count = guessesMadeSoFar()) {
	let guesses_hash = "";
	// if (bot.isFor(WORDLE) && HASH_TEST) {
		// let word, diff, current_incorrect, current_wrong_spot, current_correct, current_char;
		// let finished = [];
		// let wrong_spot = [];
		// let correct = [];
		// let unknown_spots = [...Array(word_length).keys()];
		// for (let i = 0; i < guess_count; i++) {
			// current_incorrect = [];
			// current_wrong_spot = [];
			// current_correct = [];
			// word = getWord(i);
			// diff = bot.getRowColor(i);
			// for (let j = 0; j < word_length; j++) {
				// current_char = word[j];
				// if (finished.includes(current_char)) continue;
				// switch (diff[j]) {
					// case INCORRECT: {
						// if (current_incorrect[current_char]) {
							// if (unknown_spots.includes(j)) {
								// current_incorrect[current_char].push(j);
							// }
						// } else {
							// if (unknown_spots.includes(j)) {
								// current_incorrect[current_char] = [j];
							// } else {
								// current_incorrect[current_char] = [];
							// }
						// }
						// break;
					// }
					// case WRONG_SPOT: {
						// if (current_incorrect[current_char]) {
							// if (DEBUG) console.log("ILLEGAL COLORING!");
							// return {guesses: "ILLEGAL_COLORING", settings: ""};
						// }
						// if (current_wrong_spot[current_char]) {
							// current_wrong_spot[current_char][1]++;
							// if (unknown_spots.includes(j)) {
								// current_wrong_spot[current_char][2].push(j);
							// }
						// } else {
							// if (unknown_spots.includes(j)) {
								// current_wrong_spot[current_char] = [true, 1, [j]];
							// } else {
								// current_wrong_spot[current_char] = [true, 1, []];
							// }
						// }
						// break;
					// }
					// case CORRECT: {
						// if (current_correct[current_char]) {
							// current_correct[current_char].push(j);
						// } else {
							// current_correct[current_char] = [j];
						// }
						// unknown_spots = unknown_spots.filter(x => x != j);
						// break;
					// }
				// }
			// }
			// Object.keys(current_incorrect).forEach(function(key) {
				// if (current_wrong_spot[key]) {
					// current_wrong_spot[key][0] = false;
					// current_wrong_spot[key][2] = [...current_wrong_spot[key][2], ...current_incorrect[key]];
				// } else {
					// if (wrong_spot[key]) delete wrong_spot[key];
					// finished.push(key);
				// }
			// });
			// Object.keys(current_correct).forEach(function(key) {
				// if (correct[key]) {
					// if (wrong_spot[key]) {
						// wrong_spot[key][1] -= current_correct[key].filter(x => !correct[key].includes(x)).length;
						// if (!wrong_spot[key][0] && (wrong_spot[key][1] == 0)) delete wrong_spot[key];
					// }
					// old_length = correct[key].length;
					// correct[key] = [...new Set([...correct[key], ...current_correct[key]])];
				// } else {
					// if (wrong_spot[key]) {
						// wrong_spot[key][1] -= current_correct[key].length;
						// if (!wrong_spot[key][0] && (wrong_spot[key][1] == 0)) delete wrong_spot[key];
					// }
					// correct[key] = current_correct[key];
				// }
			// });
			// Object.keys(current_wrong_spot).forEach(function(key) {
				// if (correct[key]) {
					// if (current_correct[key]) {
						// current_wrong_spot[key][1] -= correct[key].filter(x => !current_correct[key].includes(x)).length;
					// } else {
						// current_wrong_spot[key][1] -= correct[key].length;
					// }
				// }
				// if (wrong_spot[key]) {
					// wrong_spot[key][0] &&= current_wrong_spot[key][0];
					// wrong_spot[key][1] = Math.max(wrong_spot[key][1], current_wrong_spot[key][1]);
					// wrong_spot[key][2] = [...new Set([...wrong_spot[key][2], ...current_wrong_spot[key][2]])];
				// } else {
					// wrong_spot[key] = current_wrong_spot[key];
				// }
			// });
		// }
		// for (let j = true; j;) {
			// j = false;
			// Object.keys(wrong_spot).forEach(function(key) {
				// wrong_spot[key][2] = wrong_spot[key][2].filter(x => unknown_spots.includes(x));
				// if (wrong_spot[key][2].length == 0) {
					// if (wrong_spot[key][1] == 0) delete wrong_spot[key];
				// } else {
					// if ((unknown_spots.length - wrong_spot[key][1]) == wrong_spot[key][2].length) {
						// if (correct[key]) {
							// correct[key] = [...new Set([...correct[key], ...(unknown_spots.filter(x => !wrong_spot[key][2].includes(x)))])];
						// } else {
							// correct[key] = unknown_spots.filter(x => !wrong_spot[key][2].includes(x));
						// }
						// unknown_spots = unknown_spots.filter(x => !correct[key].includes(x));
						// j = true;
						// delete wrong_spot[key];
						// finished.push(key);
					// } else if (wrong_spot[key][0]) {
						// if ((wrong_spot[key][1] == 0) && (wrong_spot[key][2].length == unknown_spots.length)) {
							// delete wrong_spot[key];
							// finished.push(key);
						// }
					// }
				// }
			// });
		// }
		// if (unknown_spots.length == 0) { //answer is known
			// Object.keys(correct).sort().forEach((word) =>
				// guesses_hash += word + correct[word].sort().join("")
			// );
		// } else {
			// current_wrong_spot = 0;
			// Object.keys(wrong_spot).forEach((word) => 
				// current_wrong_spot += wrong_spot[word][1]
			// );
			// if (unknown_spots.length == current_wrong_spot) { //anagram is known
				// Object.keys(correct).sort().forEach((word) =>
					// guesses_hash += word + correct[word].sort().join("")
				// );
				// guesses_hash += "/"
				// Object.keys(wrong_spot).sort().forEach((word) =>
					// guesses_hash += word + wrong_spot[word][1] + "-" + wrong_spot[word][2].sort().join("")
				// );
			// } else {
				// Object.keys(correct).sort().forEach((word) =>
					// guesses_hash += word + correct[word].sort().join("") + ((finished.includes(word) || Object.keys(wrong_spot).includes(word))? "": "+")
				// );
				// guesses_hash += "/"
				// Object.keys(wrong_spot).sort().forEach((word) =>
					// guesses_hash += word + wrong_spot[word][1] + (wrong_spot[word][0]? "+": "-") + wrong_spot[word][2].sort().join("")
				// );
				// guesses_hash += "/" + finished.filter(x => !Object.keys(correct).includes(x)).sort().join("");
			// }
		// }
		// if (DEBUG) console.log(guesses_hash);
	// } else {
		for (let i = 0; i < guess_count; i++) {
			guesses_hash += getWord(i) + bot.getRowColor(i);
		}
	// }
	return guesses_hash;
}

function getSettingsHash(needed_difficulty, bot_type, guesses_allowed) {
	needed_difficulty ??= difficulty;
	bot_type ??= bot.type;
	guesses_allowed ??= bot.guessesAllowed();
	let extra = "";
	if (bot_type == WARMLE) {
		extra += document.getElementsByClassName("warmle-selector")[0]?.value?? "";
	} else if (bot_type == POLYGONLE) {
		extra += getPolygonlePattern();
		if ((needed_difficulty != "ultra") && polygonle_expert) extra += "E";
	}
	if (extra != "") {
		if (DEBUG) console.log("Hash extra: " + extra);
		extra = "." + extra;
	}
	return (bot_type + "." + answerlist + "." + guesslist + "." + guesses_allowed + "." + needed_difficulty + extra);
}

function getPolygonlePattern() {
	let pattern_matches = [];
	let j = 0;
	let polygonle_pattern = "";
	for (const polygonle_tile of document.getElementById("polygonle-grid")?.children) {
		if (pattern_matches[polygonle_tile.classList[1]] !== undefined) {
			polygonle_pattern += pattern_matches[polygonle_tile.classList[1]];
		} else {
			pattern_matches[polygonle_tile.classList[1]] = j;
			polygonle_pattern += j++;
		}
	}
	return polygonle_pattern;
}

function guessesArePrecomputed(guess_count = guessesMadeSoFar(), guess_hash) {
	guess_hash ??= makeGuessHash(guess_count);
	let settings_hash = getSettingsHash();

	if (seconds[guess_hash] != null) {
		if (seconds[guess_hash][settings_hash] != null) {
			return JSON.parse(seconds[guess_hash][settings_hash]);
		}
	} else seconds[guess_hash] = {};

	return false;
}


function setBestGuesses(best_guesses, guess_count = guessesMadeSoFar(), guess_hash) {
	seconds[guess_hash?? makeGuessHash(guess_count)][getSettingsHash()] = JSON.stringify(best_guesses);
}

function getBestTree(guess_count = guessesMadeSoFar(), word) {
	let browse_tree;
	const settings = getSettingsHash();
	if (FULL_TREES) browse_tree = best_trees_full?.[settings];
	else browse_tree = best_trees?.[settings]?? (SHORT_TREES? best_trees_short?.[settings]: false);
	if (!browse_tree) return null;
	for (let i = 0; i < guess_count; i++) {
		if (!(browse_tree = browse_tree?.[getWord(i)]?.[bot.getRowColor(i)])) return null;
	}
	let best_guess;
	if (word) {
		best_guess = Object.keys(browse_tree).filter(a => a == word);
	} else {
		best_guess = Object.keys(browse_tree).filter(a => guessable.includes(a)).sort((a, b) => (browse_tree[a].s > browse_tree[b].s)? 1: (browse_tree[a].s == browse_tree[b].s)? 0: -1)[0];
	}
	if (!best_guess?.length) return null;
	return {word: best_guess, average: (browse_tree[best_guess].s)};
}

function getBestGuesses(lists, guess_count = guessesMadeSoFar(), main_calculations = true, initial_guesses) {
	let best_guesses;
	let guess_list = lists.guesses;
	if (main_calculations) {
		guess_hash = makeGuessHash(guess_count);
		best_guesses = guessesArePrecomputed(guess_count, guess_hash);

		if (best_guesses) {
			return best_guesses;
		}

		if (guess_count == 0) {
			best_guesses = getFirstGuesses();
			if (best_guesses.length || lists.answers.length > 1000 + CHECK_SIZE) {
				return best_guesses;
			}
		}
	}
	if (lists.answers.length > 1000 + CHECK_SIZE) {
		best_guesses = getTempList(guess_list, lists.answers);
		if (USE_TREES && main_calculations) {
			let best_guess = getBestTree(guess_count);
			if (best_guess) {
				if (!DEBUG) best_guesses = best_guesses.filter((a) => (a.word != best_guess.word));
				best_guesses.unshift(best_guess);
			}
		}
		return best_guesses;
	}

	if (guess_count == bot.guessesAllowed()-1) {
		guess_list = lists.unique;
	}

	if (initial_guesses === undefined) {
		initial_guesses = guess_list;
	}
	initial_guesses = bot.reducesListBest(lists.answers, initial_guesses);

	if (bot.hasScore()) {
		best_guesses = sortByWrongThenAverage(calculateGuessList(lists.unique, guess_list, initial_guesses, guess_count), lists.all);
		if (USE_TREES && main_calculations) {
			let best_guess = getBestTree(guess_count);
			if (best_guess) {
				if (!DEBUG) {
					let best_score = best_guess.average;
					for (i = 0; i < best_guesses.length; i++) {
						if ((best_guesses[i].wrong_answers.length == 0) && (best_guesses[i].average == best_score)) {
							delete best_guesses[i].wrong_answers;
							if (best_guess?.word == best_guesses[i].word) best_guess = false;
						} else break;
					}
					if (best_guess) {
						best_guesses = best_guesses.filter((a) => (a.word != best_guess.word));
						best_guesses.unshift(best_guess);
						best_guesses = sortByWrongThenAverage(best_guesses, lists.all);
					}
				} else best_guesses.unshift(best_guess);
			}
		}
	} else {
		best_guesses = initial_guesses;
	}
	if (main_calculations) setBestGuesses(best_guesses, guess_count, guess_hash);
	return best_guesses;
}

// reduces list of possibilities when list is too large to check efficiently
function reduceListSize(guesses, answers) {
	// if you have <10 words left, removeUselessGuesses will actually remove some ideal guesses
	if ((answers.length > 10) && (!bot.isFor(ANTI)) && (difficulty == "easy")) {
		guesses = removeUselessGuesses(guesses, answers);
	}

	let current = answers.length * guesses.length * bot.getCount();
	if (current > MAXIMUM) {
		let ratio = current/MAXIMUM;

		guesses = guesses.slice(0, guesses.length/ratio);
	}

	for (let guess = 0; guess < guessesMadeSoFar(); guess++) {
		guesses = guesses.filter(a => a != getWord(guess));
	}

	return guesses;
}

// remove words that have letters already grayed out
// remove words that have yellow letters in the wrong spot
function removeUselessGuesses(list, possibilities) {
	let alphabet = bot.getBestLetters(possibilities);

	for (let i = 0; i < list.length; i++) {
		for (let j = 0; j < word_length; j++) {
			let c = list[i].charAt(j);

			if (alphabet[c][word_length] == 0 || // if letter isn't in any of the words
				(alphabet[c][j] == 0 && alphabet[c][word_length] == possibilities.length)) { // if letter is in every words, but never in that spot
				list.splice(i, 1);
				i--;
				break;
			}
		}
	}

	return list;
}

function getFirstGuesses() {
	let first_guesses;
	switch (difficulty) {
		case "ultra": {
			first_guesses = ultra;
			break;
		}
		case "hard": {
			first_guesses = hard;
			break;
		}
		case "easy": {
			first_guesses = easy;
			break;
		}
		default: {
			return [];
		}
	}
	first_guesses = sortByWrongThenAverage(getBestOf(first_guesses).filter(a => a.word.length == word_length), common);

	if (!first_guesses.length) {
		// first_guesses = sortByWrongThenAverage(getTempList(guessable.slice(), common.slice()), common);
	}
	if (USE_TREES) {
		let best_guess = getBestTree(0);
		if (best_guess) {
			if (!DEBUG) {
				let best_score = best_guess.average;
				for (i = 0; i < first_guesses.length; i++) {
					if (((!first_guesses[i].wrong) || (first_guesses[i].wrong == 0)) && ((!first_guesses[i].wrong_answers) || (first_guesses[i].wrong_answers.length == 0)) && (first_guesses[i].average == best_score)) {
						delete first_guesses[i].wrong_answers;
						delete first_guesses[i].wrong;
						if (best_guess?.word == first_guesses[i].word) best_guess = false;
					} else break;
				}
				if (best_guess) {
					first_guesses = first_guesses.filter((a) => (a.word != best_guess.word));
					first_guesses.unshift(best_guess);
					first_guesses = sortByWrongThenAverage(first_guesses, common);
				}
			} else first_guesses.unshift(best_guess);
		}
	}

	return first_guesses;
}

function getTempList(guesses, answers) {
	let letters = bot.getBestLetters(uniqueWordsFrom(answers.slice()));
	guesses = sortList(guesses.slice(), letters);

	if ((difficulty == "ultra") && bot.isFor(POLYGONLE)) {
		guesses = polygonleFilter(guesses);
	}

	guesses = bot.reducesListBest(answers.slice(), guesses.slice(0, 100));
	guesses = guesses.map(a => Object.assign ({}, {word: a.word, average: a.adjusted, wrong: NOT_YET_TESTED}));
	return guesses;
}

function calculateGuessList(answers, guesses, best_words, guess_count = guessesMadeSoFar()) {
	const start_time = performance.now();
	let can_finish = 0;
	let num_guesses = bot.guessesAllowed();
	if ((num_guesses == INFINITY) || (num_guesses <= guess_count)) num_guesses = 0;
	else num_guesses -= guess_count;

	for (let i = 0; i < best_words.length; i++) {
		let remaining = best_words[i].differences;

		let results = Array.apply(null, Array(num_guesses));

		results.forEach(function(a, index) { results[index] = []});
		results["w"] = [];

		Object.keys(remaining).forEach(function(key) {
			countResults(best_words[i], remaining[key], guesses, results, 0, key, guess_count);
		});
		best_words[i].results = results;

		// if (bot.isFor(ANTI)) best_words[i].wrong = 1 - best_words[i].results.length/100; //uncomment to for longest path antiwordle

		if (results["w"].length == 0) {
			can_finish++;
		}
		let run_time = performance.now()-start_time;
		if ((run_time > MAX_TIME) || ((run_time > 1000) && (can_finish > 0) && (i >= CHECK_SIZE))) {
			if (!DEBUG) console.log("only calculated " + (i+1) + " words in " + run_time + "ms, " + can_finish + " were successful");
			best_words = best_words.slice(0, i+1);
			break;
		}
		if (DEBUG && (i%100 == 0)) {
			console.log("calculated " + (i+1) + " words in " + run_time + "ms");
		}
	}
	if (DEBUG) {
		console.log("calculated " + best_words.length + "/" + guesses.length + " words in " + (performance.now()-start_time) + "ms, " + can_finish + " were successful");
	}

	return best_words.map(a => Object.assign({}, {word: a.word, average: a.average, wrong_answers: a.results["w"]}))/*.slice(0, LIST_LENGTH)*/;
}

function getNextGuesses(new_guesses, answers, best, differences) {
	let list;
	switch (difficulty) {
		case "ultra": {
			list = filterList(new_guesses, {word: best.word, colors: differences});
			break;
		}
		case "hard": {
			list = filterList(new_guesses, {word: best.word, colors: differences}, false, false, !bot.hasHardMode());
			break;
		}
		case "easy": {
			if (bot.isFor(ANTI)) {
				list = filterList(new_guesses, {word: best.word, colors: differences}, true);
			} else {
				list = reduceListSize(new_guesses, uniqueWordsFrom(answers), answers.length);
				list = combineLists(uniqueWordsFrom(answers), new_guesses);
			}
			break;
		}
	}

	return list;
}

function countResults(best, answers, guesses, results, attempt, differences, guess_count) {
	let new_guesses = combineLists(uniqueWordsFrom(answers), guesses);
	new_guesses = getNextGuesses(new_guesses, answers, best, differences);

	if (answers.length <= 2 && (!bot.isFor(ANTI) || new_guesses.length == answers.length || !answers.length)) {
		addToResults(results, answers, attempt, best.word, bot.guessesAllowed());

	} else if (guess_count + attempt < bot.guessesAllowed() - 1) {
		if (guess_count + attempt == bot.guessesAllowed() - 2) {
			new_guesses = uniqueWordsFrom(answers.slice());
		}


		let best_words = bot.reducesListBest(answers, new_guesses, true);
		if (!best_words[0]) return;
		let remaining = best_words[0].differences;

		Object.keys(remaining).forEach(function(key) {
			countResults(best_words[0], remaining[key], new_guesses, results, attempt+1, key, guess_count);
		});
	// }
	} else {
	// if (guess_count + attempt >= bot.guessesAllowed()-1) {
		results["w"] = combineLists(results["w"], answers);
	}

	calculateAverageGuesses(best, results);
}

function addToResults(results, answers, attempt, current_answer, max_guesses) {
	// if (answers.length == 0) {
	if (isEmpty(answers)) {
		addToSpot(results, current_answer, attempt);

	} else if (attempt < max_guesses) {
		addToSpot(results, answers.pop(), attempt+1);
	}

	if (answers.length && attempt < max_guesses-1) {
		addToSpot(results, answers.pop(), attempt+2);
	}
}

function addToSpot(results, answer, index) {
	if (index >= results.length) {
		if (bot.isFor(ANTI)) {
			for (let i = results.length; i <= index; i++) {
				results[i] = [];
			}
		} else {
			index = "w";
		}
	}

	results[index].push(answer);
}

function calculateAverageGuesses(current_word, results) {
	let avg = 0;

	for (let i = 0; i < results.length; i++) {
		avg += results[i].length*(i+1);
	}

	current_word.results = results;

	current_word.average = avg;
}

/* FILTER FUNCTIONS */
function filterList(list, letters = false, reduced_filter = false, split = false, ultra_mode = true, guess_count = guessesMadeSoFar()) {
	// if (guess_count == 0) return list;

	if (letters) {
		if (ultra_mode) {
			return createFilteredList(list, letters.word, letters.colors, reduced_filter);
		} else {
			return createHardModeList(list, letters.word, letters.colors);
		}
	}
	if (ultra_mode) {
		for (let guess = 0; guess < guess_count; guess++) {
			list = createFilteredList(list, getWord(guess), bot.getRowColor(guess), reduced_filter, split, guess);
		}
	} else {
		for (let guess = 0; guess < guess_count; guess++) {
			list = createHardModeList(list, getWord(guess), bot.getRowColor(guess));
		}
	}

	return list;
}

function createHardModeList(old_list, guess, difference) {
	let new_list = uniqueWordsFrom(old_list);
	let check_characters = {};
	for (let j = 0; j < word_length; j++) {
		let cur_char;
		switch (difference.charAt(j)) {
			case CORRECT: {
				cur_char = guess.charAt(j);
				new_list = new_list.filter((a) => a.charAt(j) == cur_char);
				check_characters[cur_char] ??= {count: 0, green_only: true};
				check_characters[cur_char].count++;
				break;
			}
			case WRONG_SPOT: {
				cur_char = guess.charAt(j);
				check_characters[cur_char] ??= {count: 0};
				check_characters[cur_char].green_only = false;
				check_characters[cur_char].count++;
				break;
			}
		}
	}
	for (const letter in check_characters) {
		if (!check_characters[letter].green_only) {
			new_list = new_list.filter((word) => (check_characters[letter].count <= (word.split(letter).length - 1)));
		}
	}
	return new_list;
}

function createFilteredList(old_list, guess, difference, reduced_filter, split, turn) {
	let temp_list = uniqueWordsFrom(old_list);
	let new_list = new Array(bot.getCount());
	for (let i = 0; i < new_list.length; i++) {
		new_list[i] = [];
	}

	difference = bot.getAllDifferences(difference, guess, reduced_filter);

	for (let i = 0; i < temp_list.length; i++) {
		let list_index = differencesMatch(guess, temp_list[i], difference, turn);
		if (list_index.length) {
			if (bot.getCount() > 1) {
				addToList(old_list, list_index, temp_list[i], new_list);
			} else {
				new_list[0].push(temp_list[i]);
			}
		}
	}

	if (!split) new_list = uniqueWordsFrom(new_list);
	return new_list;
}

function addToList(all_lists, indices, new_word, new_lists) {
	for (let i = 0; i < indices.length; i++) {
		let pos = indices[i];

		if (typeof all_lists[0] == "string" || all_lists[pos].includes(new_word)) {
			new_lists[pos].push(new_word);
		}
	}
}

function differencesMatch(guess, answer, all_diffs, turn) {
	let correct_diff = bot.getDifference(guess, answer, turn);
	let indices = [];

	for (let i = 0; i < all_diffs.length; i++) {
		if (correct_diff == all_diffs[i]) {
			indices.push(i);
		}
	}

	return indices;
}

function tempXordleList(list) {
	let colors = [];
	let words = [];
	let greens = [];

	for (let i = 0; i < guessesMadeSoFar(); i++) {
		colors.push(bot.getRowColor(i));
		words.push(getWord(i));

		for (let j = 0; j < colors[i].length; j++) {
			if (colors[i].charAt(j) == CORRECT) {
				if (!greens[j]) {
					greens[j] = [];
				}

				if (!greens[j].includes(words[i].charAt(j))) {
					greens[j].push(words[i].charAt(j));
				}
			}
		}
	}

	for (let i = 0; i < greens.length; i++) {
		if (!greens[i]) greens[i] = [];

		if (greens[i].length > 1) {
			for (let j = 0; j < list.length; j++) {
				if (!greens[i].includes(list[j].charAt(i))) {
					list.splice(j, 1);
					j--;
				}
			}
		}
	}

	return list;
}

function xordleFilter(list) {
	if (guessesMadeSoFar() == 0) return list;

	if (guessesMadeSoFar() > 1) {
		list = tempXordleList(list);
	}

	if (list.length > 1000) return list;

	let doubles = [];
	for (let i = 0; i < list.length; i++) {
		let rest = list.slice(i+1).filter(a => bot.getDifference(list[i], a) == INCORRECT.repeat(word_length));

		for (let j = 0; j < rest.length; j++) {
			let guess = {word1: list[i], word2: rest[j]};

			if (couldBeAnswer(guess)) {
				doubles.push(guess);
			}
		}
	}

	return doubles;
}

function couldBeAnswer(guess) {
	for (let i = 0; i < guessesMadeSoFar(); i++) {
		if (bot.getDifference(getWord(i), guess) != bot.getRowColor(i)) {
			return false;
		}
	}

	return true;
}

/* SORT FUNCTIONS */

// sorts the list based on which words have the most common letters
// used when the list is too large to check against all possibilities
function sortList(list, alphabet) {
	if (!list.length) return [];
	if (!alphabet) alphabet = bot.getBestLetters(list);

	let newranks = [];

	list.forEach(function(w) {
		newranks.push({word: w, average: 0});
	});

	let checked;

	for (let i = 0; i < newranks.length; i++) {
		checked = [];
		for (let j = 0; j < word_length; j++) {
			// if (checked[i + " " + newranks[i].word.charAt(j)] == true) continue;  //no extra credit to letters with doubles
			if (checked[newranks[i].word.charAt(j)] == true) continue;  //no extra credit to letters with doubles
			// if (alphabet[newranks[i].word.charAt(j)][word_length] == alphabet[newranks[i].word.charAt(j)][j]) continue;

			newranks[i].average += alphabet[newranks[i].word.charAt(j)][word_length] + alphabet[newranks[i].word.charAt(j)][j];
			// checked[checked[i + " " + newranks[i].word.charAt(j)] = true;
			checked[newranks[i].word.charAt(j)] = true;
		}
		newranks[i].average = 1/newranks[i].average;
	}

	newranks = sortListByAverage(newranks);
	return newranks.map(a => a.word);
}

function sortListByAverage(list) {
	if (bot.isFor(ANTI))
		return list.sort((a, b) => (a.average < b.average)? 1 : ((a.average == b.average)? 0: -1));

	return list.sort((a, b) => (a.average > b.average)? 1: ((a.average == b.average)? 0: -1));
}

function sortByWrongThenAverage(guesses, possible_words) {
	guesses.sort(function(a,b) {
		let a_wrong = a.wrong?? a.wrong_answers?.length?? 0;
		let b_wrong = b.wrong?? b.wrong_answers?.length?? 0;
		if (bot.isFor(ANTI)) {
			if (a.average < b.average) {
				return 1;
			}
			if (a.average > b.average) {
				return -1;
			}
			return (common.includes(a.word) - common.includes(b.word)) || ((a_wrong > b_wrong)? -1: ((a_wrong == b_wrong)? 0: 1));
		}
		if (a_wrong < b_wrong) {
			return -1;
		}
		if (a_wrong > b_wrong) {
			return 1;
		}
		if (a.average < b.average) {
			return -1;
		}
		if (a.average > b.average) {
			return 1;
		}
		if (difficulty == "ultra") {
			return (common.includes(a.word) - common.includes(b.word)) || ((a.word > b.word)? 1: ((a.word == b.word)? 0: -1));
		} else {
			if (possible_words.includes(b.word)) {
				if (possible_words.includes(a.word)) {
					return (common.includes(a.word) - common.includes(b.word)) || ((a.word > b.word)? 1: ((a.word == b.word)? 0: -1));
				} else {
					return (common.includes(a.word) || common.includes(b.word))? -1: 1;
				}
			} else {
				if (possible_words.includes(a.word)) {
					return (common.includes(a.word) || common.includes(b.word))? 1: -1;
				} else {
					return (common.includes(b.word) - common.includes(a.word)) || ((a.word > b.word)? 1: ((a.word == b.word)? 0: -1));
				}
			}
		}
	});

	return guesses;
}
