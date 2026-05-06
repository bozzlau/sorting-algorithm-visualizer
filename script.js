const algorithmSelect = document.querySelector("#algorithm");
const dataInput = document.querySelector("#data-input");
const applyButton = document.querySelector("#apply-data");
const randomButton = document.querySelector("#random-data");
const playPauseButton = document.querySelector("#play-pause");
const stepButton = document.querySelector("#step");
const resetButton = document.querySelector("#reset");
const barsRoot = document.querySelector("#bars");
const stepTitle = document.querySelector("#step-title");
const stepCounter = document.querySelector("#step-counter");
const errorMessage = document.querySelector("#error-message");
const algorithmName = document.querySelector("#algorithm-name");
const algorithmDescription = document.querySelector("#algorithm-description");
const cppCodeRoot = document.querySelector("#cpp-code");

const descriptions = {
  bubble: {
    name: "冒泡排序",
    text: "冒泡排序会反复比较相邻元素，如果前一个比后一个大就交换。每完成一轮，当前未排序区间里最大的元素会像气泡一样移动到右侧。"
  },
  insertion: {
    name: "插入排序",
    text: "插入排序会把左侧看作已经排好的区域，每次取出一个新元素，向左寻找合适位置并插入。它适合展示“逐步维护有序区间”的思想。"
  },
  selection: {
    name: "选择排序",
    text: "选择排序每一轮都会在未排序区间里找到最小值，再把它放到当前轮的起始位置。它的比较次数稳定，但交换次数较少。"
  }
};

const codeSnippets = {
  bubble: [
    "void bubbleSort(vector<int>& a) {",
    "    for (int end = a.size() - 1; end > 0; --end) {",
    "        bool swapped = false;",
    "        for (int i = 0; i < end; ++i) {",
    "            if (a[i] > a[i + 1]) {",
    "                swap(a[i], a[i + 1]);",
    "                swapped = true;",
    "            }",
    "        }",
    "        if (!swapped) break;",
    "    }",
    "}"
  ],
  insertion: [
    "void insertionSort(vector<int>& a) {",
    "    for (int i = 1; i < a.size(); ++i) {",
    "        int key = a[i];",
    "        int j = i - 1;",
    "        while (j >= 0 && a[j] > key) {",
    "            a[j + 1] = a[j];",
    "            --j;",
    "        }",
    "        a[j + 1] = key;",
    "    }",
    "}"
  ],
  selection: [
    "void selectionSort(vector<int>& a) {",
    "    for (int i = 0; i < a.size() - 1; ++i) {",
    "        int minIndex = i;",
    "        for (int j = i + 1; j < a.size(); ++j) {",
    "            if (a[j] < a[minIndex]) {",
    "                minIndex = j;",
    "            }",
    "        }",
    "        if (minIndex != i) {",
    "            swap(a[i], a[minIndex]);",
    "        }",
    "    }",
    "}"
  ]
};

let values = [];
let steps = [];
let currentStep = 0;
let timerId = null;
let isPlaying = false;
const defaultDelay = 700;

function parseInput(text) {
  const parts = text.split(",").map((item) => item.trim()).filter(Boolean);

  if (parts.length < 2) {
    throw new Error("请至少输入 2 个数字。");
  }

  if (parts.length > 30) {
    throw new Error("最多支持 30 个数字，这样动画会更清楚。");
  }

  const parsed = parts.map((item) => {
    const number = Number(item);
    if (!Number.isFinite(number)) {
      throw new Error(`“${item}” 不是有效数字。`);
    }
    return number;
  });

  const tooLarge = parsed.some((number) => Math.abs(number) > 999);
  if (tooLarge) {
    throw new Error("为了保持柱状图清晰，数字范围请控制在 -999 到 999。");
  }

  return parsed;
}

function setError(message = "") {
  errorMessage.textContent = message;
}

function stopPlayback() {
  isPlaying = false;
  playPauseButton.textContent = "开始";
  if (timerId) {
    clearTimeout(timerId);
    timerId = null;
  }
}

function getDelay() {
  return defaultDelay;
}

function createStep(array, message, highlight = {}) {
  return {
    array: [...array],
    message,
    comparing: highlight.comparing || [],
    active: highlight.active || [],
    minimum: highlight.minimum || [],
    sorted: highlight.sorted || [],
    swap: highlight.swap || [],
    shift: highlight.shift || [],
    insert: highlight.insert || null,
    floating: highlight.floating || null,
    codeLines: highlight.codeLines || []
  };
}

function sortedIndexesFrom(start, end) {
  const result = [];
  for (let i = start; i <= end; i += 1) {
    result.push(i);
  }
  return result;
}

function sortedIndexesExcept(start, end, omittedIndexes = []) {
  const omitted = new Set(omittedIndexes);
  return sortedIndexesFrom(start, end).filter((index) => !omitted.has(index));
}

function buildBubbleSteps(input) {
  const array = [...input];
  const result = [createStep(array, "初始数据已经准备好，开始冒泡排序。", { codeLines: [1] })];

  for (let end = array.length - 1; end > 0; end -= 1) {
    let swapped = false;
    for (let i = 0; i < end; i += 1) {
      result.push(createStep(array, `比较 ${array[i]} 和 ${array[i + 1]}。`, {
        comparing: [i, i + 1],
        sorted: sortedIndexesFrom(end + 1, array.length - 1),
        codeLines: [5]
      }));

      if (array[i] > array[i + 1]) {
        const left = array[i];
        const right = array[i + 1];
        [array[i], array[i + 1]] = [array[i + 1], array[i]];
        swapped = true;
        result.push(createStep(array, `${left} 更大，和 ${right} 交换。`, {
          comparing: [i, i + 1],
          swap: [i, i + 1],
          sorted: sortedIndexesFrom(end + 1, array.length - 1),
          codeLines: [6, 7]
        }));
      } else {
        result.push(createStep(array, `${array[i]} 不大于 ${array[i + 1]}，保持不变。`, {
          comparing: [i, i + 1],
          sorted: sortedIndexesFrom(end + 1, array.length - 1),
          codeLines: [5]
        }));
      }
    }

    result.push(createStep(array, `第 ${array.length - end} 轮结束，${array[end]} 已经就位。`, {
      sorted: sortedIndexesFrom(end, array.length - 1),
      codeLines: [2]
    }));

    if (!swapped) {
      result.push(createStep(array, "这一轮没有发生交换，数组已经有序。", {
        sorted: sortedIndexesFrom(0, array.length - 1),
        codeLines: [10]
      }));
      break;
    }
  }

  result.push(createStep(array, "排序完成。", {
    sorted: sortedIndexesFrom(0, array.length - 1),
    codeLines: [12]
  }));
  return result;
}

function buildInsertionSteps(input) {
  const array = [...input];
  const result = [createStep(array, "初始数据已经准备好，开始插入排序。", {
    sorted: [0],
    codeLines: [1]
  })];

  for (let i = 1; i < array.length; i += 1) {
    const key = array[i];
    let j = i - 1;
    const display = [...array];
    display[i] = null;

    result.push(createStep(display, `取出 ${key}，先把它悬浮保留，原位置留下一个空位。`, {
      sorted: sortedIndexesFrom(0, i - 1),
      floating: { value: key, index: i },
      codeLines: [3, 4]
    }));

    while (j >= 0 && array[j] > key) {
      result.push(createStep(display, `${array[j]} 大于 ${key}，需要向右挪进当前空位。`, {
        comparing: [j, j + 1],
        sorted: sortedIndexesFrom(0, i - 1),
        floating: { value: key, index: j + 1 },
        codeLines: [5]
      }));

      display[j + 1] = display[j];
      display[j] = null;
      result.push(createStep(display, `${array[j]} 已经向右移动，新的空位来到它原来的位置。`, {
        active: [j + 1],
        shift: [j, j + 1],
        sorted: sortedIndexesExcept(0, i, [j, j + 1]),
        floating: { value: key, index: j },
        codeLines: [6, 7]
      }));

      array[j + 1] = array[j];
      j -= 1;
    }

    if (j >= 0) {
      result.push(createStep(display, `${array[j]} 不大于 ${key}，空位就是 ${key} 的插入位置。`, {
        comparing: [j, j + 1],
        sorted: sortedIndexesFrom(0, i - 1),
        floating: { value: key, index: j + 1 },
        codeLines: [5]
      }));
    } else {
      result.push(createStep(display, `${key} 比左侧所有元素都小，应该插到最前面。`, {
        sorted: sortedIndexesFrom(1, i),
        floating: { value: key, index: 0 },
        codeLines: [5]
      }));
    }

    array[j + 1] = key;
    display[j + 1] = key;
    result.push(createStep(display, `让 ${key} 落入当前空位，左侧区间继续保持有序。`, {
      active: [j + 1],
      insert: { index: j + 1 },
      sorted: sortedIndexesFrom(0, i),
      codeLines: [9]
    }));
  }

  result.push(createStep(array, "排序完成。", {
    sorted: sortedIndexesFrom(0, array.length - 1),
    codeLines: [11]
  }));
  return result;
}

function buildSelectionSteps(input) {
  const array = [...input];
  const result = [createStep(array, "初始数据已经准备好，开始选择排序。", { codeLines: [1] })];

  for (let i = 0; i < array.length - 1; i += 1) {
    let minIndex = i;
    result.push(createStep(array, `第 ${i + 1} 轮：先把 ${array[i]} 当作当前最小值。`, {
      active: [i],
      minimum: [minIndex],
      sorted: sortedIndexesFrom(0, i - 1),
      codeLines: [2, 3]
    }));

    for (let j = i + 1; j < array.length; j += 1) {
      result.push(createStep(array, `比较当前最小值 ${array[minIndex]} 和 ${array[j]}。`, {
        comparing: [minIndex, j],
        minimum: [minIndex],
        sorted: sortedIndexesFrom(0, i - 1),
        codeLines: [5]
      }));

      if (array[j] < array[minIndex]) {
        minIndex = j;
        result.push(createStep(array, `${array[j]} 更小，更新当前最小值。`, {
          active: [j],
          minimum: [minIndex],
          sorted: sortedIndexesFrom(0, i - 1),
          codeLines: [6]
        }));
      }
    }

    if (minIndex !== i) {
      const current = array[i];
      const minimum = array[minIndex];
      [array[i], array[minIndex]] = [array[minIndex], array[i]];
      result.push(createStep(array, `把最小值 ${minimum} 和当前位置的 ${current} 交换。`, {
        comparing: [i, minIndex],
        swap: [i, minIndex],
        sorted: sortedIndexesFrom(0, i),
        codeLines: [9, 10]
      }));
    } else {
      result.push(createStep(array, `${array[i]} 已经是未排序区间的最小值，不需要交换。`, {
        sorted: sortedIndexesFrom(0, i),
        codeLines: [9]
      }));
    }
  }

  result.push(createStep(array, "排序完成。", {
    sorted: sortedIndexesFrom(0, array.length - 1),
    codeLines: [13]
  }));
  return result;
}

function buildSteps(algorithm, input) {
  if (algorithm === "bubble") {
    return buildBubbleSteps(input);
  }
  if (algorithm === "insertion") {
    return buildInsertionSteps(input);
  }
  return buildSelectionSteps(input);
}

function animateSwap([leftIndex, rightIndex]) {
  if (leftIndex === undefined || rightIndex === undefined || leftIndex === rightIndex) {
    return;
  }

  const wraps = [...barsRoot.querySelectorAll(".bar-wrap")];
  const leftWrap = wraps[leftIndex];
  const rightWrap = wraps[rightIndex];

  if (!leftWrap || !rightWrap) {
    return;
  }

  const leftBox = leftWrap.getBoundingClientRect();
  const rightBox = rightWrap.getBoundingClientRect();
  const distance = rightBox.left - leftBox.left;
  const animationOptions = {
    duration: Math.min(520, Math.max(260, getDelay() * 0.72)),
    easing: "cubic-bezier(0.2, 0.8, 0.2, 1)"
  };

  leftWrap.classList.add("is-swapping");
  rightWrap.classList.add("is-swapping");

  leftWrap.animate([
    { transform: `translateX(${distance}px)` },
    { transform: "translateX(0)" }
  ], animationOptions);
  rightWrap.animate([
    { transform: `translateX(${-distance}px)` },
    { transform: "translateX(0)" }
  ], animationOptions);

  const cleanup = () => {
    leftWrap.classList.remove("is-swapping");
    rightWrap.classList.remove("is-swapping");
  };

  window.setTimeout(cleanup, animationOptions.duration);
}

function animateShift([fromIndex, toIndex]) {
  if (fromIndex === undefined || toIndex === undefined || fromIndex === toIndex) {
    return;
  }

  const wraps = [...barsRoot.querySelectorAll(".bar-wrap")];
  const fromWrap = wraps[fromIndex];
  const toWrap = wraps[toIndex];

  if (!fromWrap || !toWrap) {
    return;
  }

  const fromBox = fromWrap.getBoundingClientRect();
  const toBox = toWrap.getBoundingClientRect();
  const distance = fromBox.left - toBox.left;

  toWrap.classList.add("is-shifting");
  toWrap.animate([
    { transform: `translateX(${distance}px)` },
    { transform: "translateX(0)" }
  ], {
    duration: Math.min(480, Math.max(240, getDelay() * 0.66)),
    easing: "cubic-bezier(0.2, 0.8, 0.2, 1)"
  });

  window.setTimeout(() => {
    toWrap.classList.remove("is-shifting");
  }, Math.min(480, Math.max(240, getDelay() * 0.66)));
}

function animateInsert(insert) {
  if (!insert) {
    return;
  }

  const wraps = [...barsRoot.querySelectorAll(".bar-wrap")];
  const wrap = wraps[insert.index];
  const bar = wrap?.querySelector(".bar:not(.placeholder)");

  if (!bar) {
    return;
  }

  wrap.classList.add("is-inserting");
  bar.animate([
    { opacity: 0.82, transform: "translateY(-92px) scale(0.92)" },
    { opacity: 1, transform: "translateY(0) scale(1)" }
  ], {
    duration: Math.min(560, Math.max(280, getDelay() * 0.76)),
    easing: "cubic-bezier(0.16, 1, 0.3, 1)"
  });

  window.setTimeout(() => {
    wrap.classList.remove("is-inserting");
  }, Math.min(560, Math.max(280, getDelay() * 0.76)));
}

function getVisibleNumbers(step) {
  const numbers = step.array.filter((value) => Number.isFinite(value));
  if (step.floating) {
    numbers.push(step.floating.value);
  }
  return numbers;
}

function getBarHeight(value, min, range) {
  const normalized = (value - min) / range;
  return 18 + normalized * 82;
}

function renderFloatingKey(step) {
  if (!step.floating) {
    return;
  }

  const wraps = [...barsRoot.querySelectorAll(".bar-wrap")];
  const wrap = wraps[step.floating.index];
  if (!wrap) {
    return;
  }

  const floating = document.createElement("div");
  floating.className = "floating-key";
  floating.textContent = step.floating.value;
  floating.title = `取出的数：${step.floating.value}`;
  wrap.append(floating);
}

function renderBars(step) {
  const array = step.array;
  const visibleNumbers = getVisibleNumbers(step);
  const min = Math.min(...visibleNumbers);
  const max = Math.max(...visibleNumbers);
  const range = Math.max(max - min, 1);

  barsRoot.innerHTML = "";
  array.forEach((value, index) => {
    const wrap = document.createElement("div");
    wrap.className = "bar-wrap";

    const bar = document.createElement("div");
    const isPlaceholder = value === null;
    const height = isPlaceholder ? 20 : getBarHeight(value, min, range);
    bar.className = isPlaceholder ? "bar placeholder" : "bar";
    bar.style.height = `${height}%`;

    if (step.comparing.includes(index)) {
      bar.classList.add("comparing");
    }
    if (step.active.includes(index)) {
      bar.classList.add("active");
    }
    if (step.minimum.includes(index)) {
      bar.classList.add("minimum");
    }
    const isActionHighlighted = step.comparing.includes(index) || step.active.includes(index) || step.minimum.includes(index);
    if (step.sorted.includes(index) && !isActionHighlighted) {
      bar.classList.add("sorted");
    }

    const label = document.createElement("div");
    label.className = "bar-label";
    label.textContent = isPlaceholder ? "空位" : value;
    label.title = isPlaceholder ? "等待插入的位置" : String(value);

    wrap.append(bar, label);
    barsRoot.append(wrap);
  });

  renderFloatingKey(step);
  animateSwap(step.swap);
  animateShift(step.shift);
  animateInsert(step.insert);
}

function renderCppCode(step) {
  const activeLines = new Set(step.codeLines);
  cppCodeRoot.innerHTML = "";

  codeSnippets[algorithmSelect.value].forEach((line, index) => {
    const lineNumber = index + 1;
    const row = document.createElement("div");
    row.className = "code-line";
    if (activeLines.has(lineNumber)) {
      row.classList.add("is-active");
    }

    const number = document.createElement("span");
    number.className = "code-line-number";
    number.textContent = lineNumber;

    const content = document.createElement("code");
    content.className = "code-line-content";
    content.textContent = line || " ";

    row.append(number, content);
    cppCodeRoot.append(row);
  });

  cppCodeRoot.querySelector(".code-line.is-active")?.scrollIntoView({
    block: "nearest",
    behavior: "smooth"
  });
}

function renderStep() {
  const step = steps[currentStep];
  renderBars(step);
  renderCppCode(step);
  stepTitle.textContent = step.message;
  stepCounter.textContent = `${currentStep} / ${Math.max(steps.length - 1, 0)}`;
  stepButton.disabled = currentStep >= steps.length - 1;
  playPauseButton.disabled = currentStep >= steps.length - 1;
}

function refreshAlgorithmText() {
  const info = descriptions[algorithmSelect.value];
  algorithmName.textContent = info.name;
  algorithmDescription.textContent = info.text;
}

function resetDemo(nextValues = values) {
  stopPlayback();
  values = [...nextValues];
  steps = buildSteps(algorithmSelect.value, values);
  currentStep = 0;
  refreshAlgorithmText();
  renderStep();
}

function applyDataFromInput() {
  try {
    const parsed = parseInput(dataInput.value);
    setError();
    resetDemo(parsed);
  } catch (error) {
    stopPlayback();
    setError(error.message);
  }
}

function advanceStep() {
  if (currentStep >= steps.length - 1) {
    stopPlayback();
    renderStep();
    return false;
  }
  currentStep += 1;
  renderStep();
  return true;
}

function scheduleNextStep() {
  timerId = setTimeout(() => {
    const moved = advanceStep();
    if (moved && currentStep < steps.length - 1 && isPlaying) {
      scheduleNextStep();
    } else {
      stopPlayback();
    }
  }, getDelay());
}

function togglePlayback() {
  setError();
  if (isPlaying) {
    stopPlayback();
    return;
  }

  if (currentStep >= steps.length - 1) {
    currentStep = 0;
    renderStep();
  }

  isPlaying = true;
  playPauseButton.textContent = "暂停";
  scheduleNextStep();
}

function randomizeData() {
  const length = Math.floor(Math.random() * 7) + 8;
  const randomValues = Array.from({ length }, () => Math.floor(Math.random() * 90) + 10);
  dataInput.value = randomValues.join(", ");
  setError();
  resetDemo(randomValues);
}

function performSingleStep() {
  stopPlayback();
  setError();
  advanceStep();
}

function isEditingField(element) {
  return ["INPUT", "TEXTAREA", "SELECT"].includes(element?.tagName) || element?.isContentEditable;
}

applyButton.addEventListener("click", applyDataFromInput);
randomButton.addEventListener("click", randomizeData);
playPauseButton.addEventListener("click", togglePlayback);
stepButton.addEventListener("click", performSingleStep);
resetButton.addEventListener("click", () => {
  setError();
  resetDemo(values);
});
algorithmSelect.addEventListener("change", () => {
  setError();
  resetDemo(values);
});
document.addEventListener("keydown", (event) => {
  if (event.key !== "ArrowRight" || isEditingField(document.activeElement)) {
    return;
  }

  event.preventDefault();
  performSingleStep();
});

values = parseInput(dataInput.value);
resetDemo(values);
