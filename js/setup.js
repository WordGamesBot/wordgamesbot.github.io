ready(function() {
	createPage();

	document.getElementById("bot-type").addEventListener("input", function(e) {
		setBotMode(e.target.value);
		resetPage();
		createPage();
	});

	document.getElementById("word-length").addEventListener("input", function(e) {
		localStorage.setItem("word_length" + bot.type, e.target.value);
		createPage();
	});

	document.getElementById("max-guesses").addEventListener("input", function(e) {
		localStorage.setItem("guesses" + bot.type, e.target.value);
		createPage();
	});

	for (const answerlist_element of document.getElementsByClassName("answerlist")) {
		answerlist_element.addEventListener("input", function(e) {
			localStorage.setItem("answerlist", e.target.id);
			setWordbank();
			update();
		});
	}

	for (const guesslist_element of document.getElementsByClassName("guesslist")) {
		guesslist_element.addEventListener("input", function(e) {
			localStorage.setItem("guesslist", e.target.id);
			setWordbank();
			update();
		});
	}

	document.getElementById("use_all_acceptable_checkbox").addEventListener("input", function(e) {
		localStorage.setItem("use_all_acceptable_checkbox", e.target.checked);
		setWordbank();
		update();
	});

	document.getElementById("word-known-answer").addEventListener("input", function(e) {
		let value = e.target.value;
		if (value[value.length-1] == ",") e.target.value = value = value.slice(0, value.length-1);
		let answers = value.split(",");
		if (answers.every(a => ((a.length == word_length) && (common.includes(a))))) {
			bot.setAnswers(answers);
			let bot_count = bot.getCount();
			if (bot_count == 1 && bot.type == XORDLE) bot_count = 2;
			if (answers.length == bot_count) {
				e.target.blur();
				e.target.style.backgroundColor = (bot.type == FIBBLE)? "blue": "green";
			} else {
				e.target.style.backgroundColor = "blue";
				e.target.maxLength = (answers.length+1)*(word_length+1)-1;
				if (e.data) e.target.value = value+",";
				else e.target.maxLength = answers.length*(word_length+1)-1;
			}
		} else {
			e.target.maxLength = answers.length*(word_length+1)-1;
			bot.setAnswers();
			e.target.style.backgroundColor = "transparent";
		}
	});
	
	document.getElementById("word-known-answer").addEventListener("keyup", function(e) {
		if (e.keyCode == 13/* && e.shiftKey*/) {
			let value = e.target.value;
			let answers = value.split(",");
			bot.setAnswers(answers);
			let bot_count = bot.getCount();
			if (bot_count == 1 && bot.type == XORDLE) bot_count = 2;
			if (answers.length < bot_count) {
				e.target.style.backgroundColor = "blue";
				e.target.maxLength = (answers.length+1)*(word_length+1)-1;
				e.target.value = value+",";
			} else {
				if (answers.every(a => (a.length == word_length))) {
					e.target.blur();
					e.target.style.backgroundColor = (bot.type == FIBBLE)? "blue": "green";
				} else {
					e.target.style.backgroundColor = "blue";
				}
			}
		}
	});

	document.getElementById("word-entered").addEventListener("input", function(e) {
		let val = e.target.value;
		if ((val.length == word_length) && guessable.includes(val)) {
			// e.target.blur();
			makeTables(val);
		}
	});
	
	document.getElementById("word-entered").addEventListener("keyup", function(e) {
		if (e.keyCode == 13/* && e.shiftKey*/) {
			let val = e.target.value;
			if (val.length == word_length) {
				// e.target.blur();
				makeTables(val);
			}
		}
	});

	document.addEventListener("click", (e) => {
		switch (e.target.classList[0]) {
			case "mode-switcher": {
				setDifficulty(e.target.id);
				update();
				break;
			}
			case "click": {
				if (e.shiftKey && (bot.getCount() == 1) && (bot.type != XORDLE)) {
					let answer_field = document.getElementById("word-known-answer");
					bot.setAnswers([answer_field.value = e.target.innerText]);
					answer_field.style.backgroundColor = "green";
				} else makeTables(e.target.innerText);
				break;
			}
			case "showlist": {
				for (const elem of e.target.children) {
					if (elem.style.display === "none") elem.style.display = "";
					else elem.style.display = "none";
				}
				break;
			}
			case "losingscore": {
				for (const elem of e.target.children) {
					if (elem.style.display === "none") {
						for (const other_elems of document.getElementsByClassName("losingscore")) {
							for (const other_elem of other_elems.children) other_elem.style.display = "none";
						}
						elem.style.display = "";
					} else elem.style.display = "none";
				}
				break;
			}
		}
	});
});

function setDifficulty(new_difficulty) {
	difficulty = new_difficulty;
	if (bot.isFor(POLYGONLE)) {
		let expert_mode_checkbox = document.getElementById("expert_mode");
		if (difficulty == "ultra") {
			expert_mode_checkbox.checked = true;
			expert_mode_checkbox.disabled = true;
		} else {
			expert_mode_checkbox.disabled = false;
			expert_mode_checkbox.checked = polygonle_expert;
		}
	}
}

function getTile(index) {
	const shapes = [`<svg width="2.25rem" height="2.25rem" viewBox="0 0 59.8 59.8" xmlns="http://www.w3.org/2000/svg" style="pointer-events: none"><g id="svgGroup" stroke-linecap="round" fill-rule="evenodd" font-size="9pt" stroke="#?" stroke-width="0.25mm" fill="#?"><path d="M 59.8 0 L 59.8 59.8 L 0 0 L 59.8 0 Z" vector-effect="non-scaling-stroke"></path></g></svg>`,
					`<svg width="2.25rem" height="2.25rem" viewBox="0 0 59.8 59.8" xmlns="http://www.w3.org/2000/svg" style="pointer-events: none"><g id="svgGroup" stroke-linecap="round" fill-rule="evenodd" font-size="9pt" stroke="#?" stroke-width="0.25mm" fill="#?"><path d="M 59.8 59.8 L 0 59.8 L 59.8 0 L 59.8 59.8 Z" vector-effect="non-scaling-stroke"></path></g></svg>`,
					`<svg width="2.25rem" height="2.25rem" viewBox="0 0 59.8 59.8" xmlns="http://www.w3.org/2000/svg" style="pointer-events: none"><g id="svgGroup" stroke-linecap="round" fill-rule="evenodd" font-size="9pt" stroke="#?" stroke-width="0.25mm" fill="#?"><path d="M 0 59.8 L 0 0 L 59.8 59.8 L 0 59.8 Z" vector-effect="non-scaling-stroke"></path></g></svg>`,
					`<svg width="2.25rem" height="2.25rem" viewBox="0 0 59.8 59.8" xmlns="http://www.w3.org/2000/svg" style="pointer-events: none"><g id="svgGroup" stroke-linecap="round" fill-rule="evenodd" font-size="9pt" stroke="#?" stroke-width="0.25mm" fill="#?"><path d="M 0 0 L 59.8 0 L 0 59.8 L 0 0 Z" vector-effect="non-scaling-stroke"></path></g></svg>`,
					`<svg width="2.25rem" height="2.25rem" viewBox="0 0 100.7 100.7" xmlns="http://www.w3.org/2000/svg" style="pointer-events: none"><g id="svgGroup" stroke-linecap="round" fill-rule="evenodd" font-size="9pt" stroke="#?" stroke-width="0.25mm" fill="#?"><path d="M 100.7 50.4 L 50.4 100.7 L 0 50.4 L 50.4 0 L 100.7 50.4 Z" vector-effect="non-scaling-stroke"></path></g></svg>`,
					`<svg width="2.25rem" height="2.25rem" viewBox="0 0 72.4 86.6" xmlns="http://www.w3.org/2000/svg" style="pointer-events: none"><g id="svgGroup" stroke-linecap="round" fill-rule="evenodd" font-size="9pt" stroke="#?" stroke-width="0.25mm" fill="#?"><path d="M 72.4 64.5 L 36.2 86.6 L 0 64.5 L 0 22.1 L 36.2 0 L 72.4 22.1 L 72.4 64.5 Z" vector-effect="non-scaling-stroke"></path></g></svg>`,
					`<svg width="2.25rem" height="2.25rem" viewBox="0 0 60.8 60.8" xmlns="http://www.w3.org/2000/svg" style="pointer-events: none"><g id="svgGroup" stroke-linecap="round" fill-rule="evenodd" font-size="9pt" stroke="#?" stroke-width="0.25mm" fill="#?"><path d="M 60.8 60.8 L 0 60.8 L 0 0 L 60.8 0 L 60.8 60.8 Z" vector-effect="non-scaling-stroke"></path></g></svg>`];
	const colors = ["FFFF33", "64FB6C", "FD8C44", "15F4FF", "A63FC5", "3E90DE", "FF407B"];
	const shape_index = index%shapes.length;
	return shapes[shape_index].replaceAll("?", colors[(shape_index+(index-shape_index)/shapes.length)%colors.length]);
}

function resetAnswers() {
	bot.setAnswers();
	let answer_field = document.getElementById("word-known-answer");
	answer_field.value = "";
	answer_field.style.backgroundColor = "transparent";
}

function createPage() {
	getPreferences();
	drawPage();
	setWordbank();
	update();
}

function resetPage() {
	spotle = false;

	clearHTML(document.getElementById("next-previous-buttons"));
	clearGrids();
}

function clearGrids() {
	let grids = document.getElementsByClassName("grid");

	for (let i = 0; i < grids.length; i++) {
		clearHTML(grids[i]);
	}

	let full_grid = document.getElementById("hints");
	full_grid.classList.add("empty");

	if (!bot.isFor(POLYGONLE)) {
		clearPolygonle();
	}
}

function getPreferences() {
	if (localStorage.getItem("bot_type")) {
		let bot_type = localStorage.getItem("bot_type");
		setBotMode(bot_type);
		document.getElementById("bot-type").value = bot_type;
	} else {
		setBotMode(WORDLE);
	}

	if (localStorage.getItem("answerlist")) {
		answerlist = localStorage.getItem("answerlist");
		document.getElementById(answerlist).checked = true;
		// setWordbank();
	}

	if (localStorage.getItem("guesslist")) {
		guesslist = localStorage.getItem("guesslist");
		document.getElementById(guesslist).checked = true;
		// setWordbank();
	}
	if (localStorage.getItem("use_all_acceptable_checkbox")) {
		let use_all_acceptable_checkbox = localStorage.getItem("use_all_acceptable_checkbox");
		document.getElementById("use_all_acceptable_checkbox").checked = localStorage.getItem("use_all_acceptable_checkbox");
		// setWordbank();
	}

	// if (bot.isFor(WARMLE) && localStorage.getItem("warmle_dist")) {
	//	 let dist = localStorage.getItem("warmle_dist");
	//	 document.getElementsByClassName("warmle-selector")[0].value = dist;
	// }
	if (localStorage.getItem("word_length"+ bot.type)) {
		word_length = localStorage.getItem("word_length"+ bot.type);
	}

	if (URLParams.has("ultra")) {
		document.getElementById("ultra").checked = true;
		difficulty = "ultra";
	} else if (URLParams.has("hard")) {
		let hard_mode = getHardMode();
		hard_mode.checked = true;
		difficulty = hard_mode.id;
	} else if (URLParams.has("easy")) {
		document.getElementById("easy").checked = true;
		difficulty = "easy";
	}
}

function drawPage() {
	let container = document.getElementById("container");
	let header = document.getElementById("top-of-screen");
	let hints = document.getElementById("hints");

	addGrid(hints);

	createMainHeader(header);
	createWordLengthSelector();

	createKnownAnswerInput(container);
	createGuessInput(container);
	createAnswerSuggestions(container);

	updateWarmleSelector();

	if (bot.isFor(POLYGONLE)) {
		createPolygonleInput();
	}
}

function createPolygonleInput() {
	let polygonle_grid = document.getElementById("polygonle-grid");
	if (polygonle_grid?.children.length != word_length) {
		polygonle_grid?.remove();
		polygonle_grid = createElement("div", "", "polygonle-grid", "polygonle-grid");
		for (let i = 0; i < word_length; i++) {
			let polygonle_tile = createElement("button", getTile(i), "polygonle-tile " + i);
			polygonle_grid.append(polygonle_tile);
		}
		polygonle_grid.addEventListener("click", (e) => {
			let current = Number(e.target.classList[1]);
			let next = (current+1)%word_length;
			e.target.classList.replace(current, next);
			e.target.innerHTML = getTile(next);
		});
		document.getElementById("word-entered").after(polygonle_grid);
	}
	let polygonle_buttons = document.getElementById("polygonle-filter");
	if (!polygonle_buttons) {
		polygonle_buttons = createElement("button", "set polygonle options", "polygonle-filter", "polygonle-filter");
		polygonle_buttons.addEventListener("click", function() {
			update();
		});
		polygonle_grid.after(polygonle_buttons);
	}
}

function clearPolygonle() {
	document.getElementById("polygonle-grid")?.remove();
	document.getElementById("polygonle-filter")?.remove();
}

function updateWarmleSelector() {
	let warmle_selector_div = document.getElementById("warmle-selector-div");
	if (bot.isFor(WARMLE)) {
		if (!warmle_selector_div) {
			warmle_selector_div = createElement("div", "Yellows are ", "", "warmle-selector-div");
			let warmle_selector = createElement("select", "", "warmle-selector", "warmle-selector");

			for (let i = 1; i <= 3; i++) {
				let warmle_option = createElement("option", i);
				warmle_option.value = i;
				warmle_selector.append(warmle_option);
			}

			warmle_selector_div.addEventListener("change", (e) => {
				localStorage.setItem("warmle_dist", e.target.value);
				update();
			});

			warmle_selector_div.append(warmle_selector);
			warmle_selector_div.innerHTML += " letters away from the correct letter.";
			document.getElementById("mode-selector").after(warmle_selector_div);
			document.getElementById("warmle-selector").value = localStorage.getItem("warmle_dist") || 3;
		}
	} else {
		warmle_selector_div?.remove();
	}
}

function addGrid(hints) {
	clearHTML(hints);

	for (let i = 0; i < bot.getCount(); i++) {
		let grid = createElement("div", "", "grid");
		hints.append(grid);
	}

	if (bot.isFor(SPOTLE)) {
		setUpBlankGrid();
	}
}

function setUpBlankGrid() {
	let grid_size = 6;

	for (let i = 0; i < grid_size; i++) {
		makeTables(" ".repeat(word_length));
	}

	addFinalizeGridButton();
}

function addFinalizeGridButton() {
	clearHTML(document.getElementById("next-previous-buttons"));

	let finalize = createElement("button", "finalize grid", "finalize");
	let button_container = document.getElementById("next-previous-buttons");

	finalize.addEventListener("click", function () {
		update();
	});

	button_container.append(finalize);
}

function createMainHeader(div) {
	let main_header = document.getElementById("top-of-screen");
	let title = main_header.getElementsByTagName("h1")[0];

	title.innerHTML = bot.type + " Calcle";
	main_header.append(title);
}

function createWordLengthSelector() {
	let select_length = document.getElementById("word-length");

	let options = "";
	for (let i = SMALLEST_WORD; i <= LARGEST_WORD; i++) {
		let selected = "";
		if (i == 5) selected = `selected = "selected"`;
		options += `<option value="` + i + `" ` + selected +`>` + i + `</option>`;
	}

	if (bot.isFor(THIRDLE)) {
		localStorage.setItem("word_length" + bot.type, 3);
		options = `<option value ="3" selected = "selected">3</option>`;
	}

	if (bot.isFor(SPOTLE)) {
		localStorage.setItem("word_length" + bot.type, 5);
		options = `<option value ="5" selected = "selected">5</option>`;
	}

	select_length.innerHTML = options;
	let new_word_length = localStorage.getItem("word_length"+ bot.type);
	if (new_word_length && new_word_length >= SMALLEST_WORD || bot.isFor(THIRDLE)) {
		select_length.value = new_word_length;
	}
	// setWordbank();
}

function createMaxGuesses(div) {
	let max_input = document.getElementById("max-guesses");

	let options = "";
	for (let i = 3; i <= 21; i++) {
		let selected = "";
		if (i == 6) selected = `selected = "selected"`;
		options += `<option value="` + i + `" ` + selected +`>` + i + `</option>`;
	}

	if (bot.isFor(THIRDLE)) {
		localStorage.setItem("guesses" + bot.type, 3);
		options = `<option value ="3" selected = "selected">3</option>`;
	}

	if (bot.isFor(SPOTLE)) {
		localStorage.setItem("guesses" + bot.type, 6);
		options = `<option value ="6" selected = "selected">6</option>`;
	}

	max_input.innerHTML = options;

	if (localStorage.getItem("guesses" + bot.type)) {
		max_input.value = localStorage.getItem("guesses" + bot.type);
	}
}

const EXAMPLE_LIST =
	[
		{word: "WOMEN", score: "≤2.697 guesses left"},
		{word: "WOMAN", score: "≤2.788 guesses left"},
		{word: "BONGO", score: "≤3.091 guesses left"},
		{word: "BONES", score: "≥96.97% solve rate"}
	];

function createExample() {
	let example_row = createRow("TONIC", "dummy");
	bot.setRowColor("BGYBB", example_row);

	let example_list = createElement("ul", "", "word-list dummy");

	for (let i = 0; i < EXAMPLE_LIST.length; i++) {
		// example_list.innerHTML += createListItem(EXAMPLE_LIST[i].word, EXAMPLE_LIST[i].score, i+1);
		example_list.append(createListItem(EXAMPLE_LIST[i].word, EXAMPLE_LIST[i].score, i+1, (common.includes(EXAMPLE_LIST[i].word))? "likely_suggestion": ""));
	}

	return {row: example_row, list: example_list};
}

function createWrongExample() {
	let example_wrong = createElement("ul", "", "word-list dummy");
	// example_wrong.innerHTML = createListItem(EXAMPLE_LIST[0].word, (EXAMPLE_LIST[0].wrong+" solve rate"), 1);
	example_wrong.append(createListItem(EXAMPLE_LIST[0].word, (EXAMPLE_LIST[0].wrong+" solve rate"), 1));

	return example_wrong;
}

function makeCloseButton(type) {
	let close_button = createElement("button", "", type + " close");
	return close_button;
}

function createInfoParagraphs() {
	let p1 = createElement("p", `Simply enter in your guesses, click on the tiles until the colors match, hit calculate,
								and the WordleBot will give you the best possible guesses from that point.`);

	let p2 = createElement("p", `This means the best guess from this point would be <b>` + EXAMPLE_LIST[0].word + `</b>,
								and that you have an average of <b>` + EXAMPLE_LIST[0].score + `</b>.<br>
								And if you guess <b>` + EXAMPLE_LIST[(EXAMPLE_LIST.length-1)].word + `</b>,
								you are guaranteed to solve only <b>` + EXAMPLE_LIST[(EXAMPLE_LIST.length-1)].score.slice(0, 7) + `</b>
								of the remaining possible answers within ` + bot.guessesAllowed() + ` guesses.<br>
								If score starts with ≤/≥, there is no guarantee, that bot found the best possible solution. You might find a better one by exploring the solve on your own.<br>
								If score does not start with a sign, it is the best possible guess in current situation, and no other guess can beat that score.`);

	let p3 = createElement("p", `Suggestions, that are included in chosen answer list, are written in bold font (whether they follow given clues or not).<br>
								Suggestions that follows all of the clues on the board are written in green.<br>
								Suggestions that follows Wordle-style hard mode rules are written in yellow (available only in Wordle and Polygonle modes).<br>
								The rest of the suggestions are written in white.`);

	let p4 = createElement("p", `Want to see how good your starting word is? Click the
								<button class = "test dummy" disabled><i class="gg-bot"></i></button> on the top right to get a good idea.`);

	return [p1, p2, p3, p4]
}

function explainExample() {
	let explanation = createElement("div", "", "description");

	if (bot.isFor(WORDLE)) {
		explanation.innerHTML = "O is in the correct position, N is in the word but not in the correct position, and T, I, and C are not in the word."
	}

	if (bot.isFor(WOODLE)) {
		explanation.innerHTML = "TONIC has one letter in the correct position, and one letter in the word, but not in the correct position";
	}

	if (bot.isFor(PEAKS)) {
		explanation.innerHTML = "The 1st letter of the word comes before T in the alphabet, the 2nd is O, the 3rd comes after N, the 4th comes before I, and the 5th comes before C.";
	}

	return explanation;
}

function createInfoPage() {
	let info = document.getElementsByClassName("info screen")[0];
	if (info.classList.contains("display")) return;

	let close_button = makeCloseButton("info");
	let example = createExample();
	let explanation = explainExample();
	// let example_wrong = createWrongExample();
	let paragraphs = createInfoParagraphs();

	let main_header = createElement("h3", "How does this Work?", "top-header");
	let sub_header = createElement("h3", "After each guess you should see something like this:", "mini");

	info.append(close_button);   // button to close screen
	info.append(main_header);	// 'how does this work'
	info.append(paragraphs[0]);  // intro paragraph
	info.append(sub_header);	 // header to examples
	info.append(example.row);	// example row w/ colors
	info.append(explanation)	 // explanation of tiles
	info.append(example.list);   // example answer list
	info.append(paragraphs[1]);  // explanation of answer list
	// info.append(example_wrong);  // example answer list with wrong %
	info.append(paragraphs[2]);  // explanation of wrong %
	info.append(paragraphs[3]);  // bot paragraph

	info.classList.remove("back");
	info.classList.add("display");

	close_button.addEventListener("click", function() {
		info.classList.remove("display");
		info.classList.add("back");
		clearHTML(info);
	});
}

function createSettingsPage() {
	let settings = document.getElementsByClassName("settings screen")[0];

	settings.classList.remove("hide");
	settings.classList.add("display");

	let close = settings.getElementsByClassName("close")[0];
	close.addEventListener("click", function() {
		settings.classList.remove("display");
		settings.classList.add("hide");
	});
}

function createKnownAnswerInput(div) {
	let input = document.getElementById("word-known-answer");
	// document.querySelector("#known-answer-div").style.setProperty("background", "transparent");
	// input.value = "";
	// bot.setAnswers();
	setInputAttributes(input, "enter known answer");
}

function createGuessInput(div) {
	let input = document.getElementById("word-entered");
	setInputAttributes(input, "enter guess here");
}

function setInputAttributes(input, placeholder) {
	input.setAttribute("autocomplete", "off");
	input.setAttribute("placeholder", placeholder);
	input.setAttribute("onkeypress", "return /[a-z_]/i.test(event.key)");
	input.setAttribute("oninput", "this.value = this.value.toUpperCase()");
}

function createAnswerSuggestions() {
	getHardMode();

	let suggestions = document.getElementById("suggestions");

	if (bot.hasMax()) {
		createMaxGuesses(suggestions);
	} else {
		let max = document.getElementById("max-guesses");
		localStorage.setItem("guesses" + bot.type, "infinity");
		max.innerHTML = `<option value ="infinity" selected = "selected"> &#8734 </option>`;
	}

	createAnswerLists(suggestions);
}

function createAnswerLists(div) {
	if (document.getElementById("answers")) {
		document.getElementById("answers").remove();
	}

	let answer_lists = createElement("div", "", "", "answers");

	createOptions(answer_lists);
	div.append(answer_lists);
}

function createOptions(div) {
	let best_guesses = createElement("div", "", "best-guesses");
	let word_list = createElement("ul", "", "word-list");

	best_guesses.append(word_list);
	div.append(best_guesses);
}

function getHardMode() {
	let hard_mode = document.getElementById("hard");
	if (hard_mode) {
		if (!bot.hasHardMode()) {
			if (hard_mode.checked) document.getElementById("ultra").checked = true;
			hard_mode.remove();
			document.querySelector("label[for=hard]").remove();
			hard_mode = document.getElementById("ultra");
		}
	} else if (bot.hasHardMode()) {
		let mode_switcher_div = document.getElementById("mode-switcher");
		let ultra_mode = document.getElementById("ultra");
		let hard_mode_label = document.createElement("label");
		hard_mode_label.setAttribute("for", "hard");
		hard_mode_label.innerHTML = "Hard";
		hard_mode = document.createElement("input");
		hard_mode.setAttribute("id", "hard");
		hard_mode.setAttribute("type", "radio");
		hard_mode.setAttribute("class", "mode-switcher");
		hard_mode.setAttribute("name", "mode-switcher");
		mode_switcher_div.insertBefore(hard_mode, ultra_mode);
		mode_switcher_div.insertBefore(hard_mode_label, ultra_mode);
		// hard_mode.addEventListener("change", function(e) {
			// setDifficulty(e.target.id);
			// update();
		// });
	} else hard_mode = document.getElementById("ultra");
	let expert = document.getElementById('expert_mode');
	if (bot.isFor(POLYGONLE)) {
		if (!expert) {
			let expert_label = createElement('div', `"Expert" Mode:`, 'expert label');
			let expert_container = createElement('label', '', 'expert switch');
			let expert_slider = createElement('span', '', 'slider round');
			let expert_checkbox = createElement('input', '', '', 'expert_mode');
			expert_checkbox.setAttribute('type', 'checkbox');

			expert_container.append(expert_checkbox);
			expert_container.append(expert_slider);

			let header = document.getElementsByClassName('mini-title')[0];
			let div = document.getElementById('suggestions');
			div.insertBefore(expert_label, header);
			div.insertBefore(expert_container, header);

			expert_checkbox.addEventListener('change', function() {
				polygonle_expert = !polygonle_expert;
				update();
			});
		}
	} else {
		polygonle_expert = false;
		if (expert) {
			document.getElementsByClassName('expert label')[0]?.remove();
			document.getElementsByClassName('expert switch')[0]?.remove();
		}
	}
	return hard_mode;
}