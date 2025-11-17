const themeToggleButton = document.getElementById("theme-toggle")
const htmlElement = document.documentElement

if (themeToggleButton) {
    const applyTheme = (theme) => {
        htmlElement.setAttribute("data-bs-theme", theme)
        localStorage.setItem("theme", theme)
    }
    const toggleTheme = () => {
        const currentTheme = htmlElement.getAttribute("data-bs-theme") ||
            (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
        const newTheme = currentTheme === "dark" ? "light" : "dark"
        applyTheme(newTheme)
    }
    themeToggleButton.addEventListener('click', toggleTheme)
    const savedTheme = localStorage.getItem("theme") ||
        (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    applyTheme(savedTheme)
}


const formulaCard = document.querySelector(".col-lg-6:first-child")
const functionInput = document.getElementById("functionInput")
const plotButton = document.getElementById("plotButton")
const resetZoomButton = document.getElementById("resetZoomButton")
const ctx = document.getElementById("signalChart").getContext("2d")
let isInteractiveMode = false


if (resetZoomButton) {
    resetZoomButton.addEventListener('click', () => {
        if (signalChart) {
            signalChart.resetZoom()
        }
    })
}

function rect(x, width) {
    return Math.abs(x) <= width / 2 ? 1 : 0
}

function tri(x, width) {
    return Math.abs(x) <= width ? (1 - Math.abs(x) / width) : 0
}

function sinc(x) {
    if (Math.abs(x) < 1e-10) return 1

    const arg = Math.PI * x
    return Math.sin(arg) / arg
}

function gauss(x) {
    return Math.exp(-x * x)
}

function exp(x) {
    return Math.exp(-Math.abs(x))
}

function step(x) {
    if (x > 0) {
        return 1
    } else if (x < 0) {
        return 0
    } else {
        return 0.5
    }
}

function delta(x, epsilon = 0.1) {
    return Math.abs(x) < epsilon ? 1 / (2 * epsilon) : 0
}


function parse(f) {
    const state = {
        expr: f.replace(/\s+/g, '').toLowerCase(),
        pos: 0
    }
    return parseAddSub(state)
}

function parseAddSub(state) {
    let left = parseMulDiv(state)

    while (state.pos < state.expr.length) {
        const ch = state.expr[state.pos]

        if (ch === '+' || ch === '-') {
            state.pos++

            const right = parseMulDiv(state)
            const op = ch
            const leftFunc = left
            const rightFunc = right

            left = (f) => {
                const l = leftFunc(f)
                const r = rightFunc(f)
                return op === '+' ? l + r : l - r
            }
        } else {
            break
        }
    }
    return left
}


function parseMulDiv(state) {
    let left = parseUnary(state)
    while (state.pos < state.expr.length) {
        const ch = state.expr[state.pos]

        if (ch === '*' || ch === "/") {
            state.pos++
            const right = parseUnary(state)

            const op = ch
            const leftFunc = left
            const rightFunc = right

            left = (f) => {
                const l = leftFunc(f)
                const r = rightFunc(f)

                return op === "*" ? l * r : l / r
            }
        } else {
            break
        }
    }
    return left
}


function parseUnary(state) {
    if (state.pos < state.expr.length && state.expr[state.pos] === "-") {
        state.pos++
        const operand = parseUnary(state)
        return (f) => -operand(f)
    }
    return parsePrimary(state)
}


function parsePrimary(state) {
    if (state.expr[state.pos] === "(") {
        state.pos++
        const exprRes = parseAddSub(state)

        if (state.expr[state.pos] === ")") {
            state.pos++
        }
        return exprRes
    }

    if (/[\d.]/.test(state.expr[state.pos])) {
        return parseNumber(state)
    }

    if (/[a-z]/.test(state.expr[state.pos])) {
        return parseFunction(state)
    }

    return (f) => 0
}


function parseNumber(state) {
    let numStr = ""

    while (state.pos < state.expr.length && /[\d.]/.test(state.expr[state.pos])) {
        numStr += state.expr[state.pos]
        state.pos++
    }

    const value = parseFloat(numStr)
    return (f) => value
}


function parseFunction(state) {
    let funcName = ""

    while (state.pos < state.expr.length && /[a-z]/.test(state.expr[state.pos])) {
        funcName += state.expr[state.pos]
        state.pos++
    }

    if (funcName === "f" || funcName === "t") return (f) => f

    if (funcName === "pi") return () => Math.PI

    if (state.expr[state.pos] === "(") {
        state.pos++
        const arg = parseAddSub(state)

        if (state.expr[state.pos] === ")") {
            state.pos++
        }

        switch (funcName) {
            case 'rect': return (f) => rect(arg(f), 1)
            case 'tri': return (f) => tri(arg(f), 1)
            case 'sinc': return (f) => sinc(arg(f))
            case 'gauss': return (f) => gauss(arg(f))
            case 'exp': return (f) => exp(arg(f))
            case 'step': return (f) => step(arg(f))
            case 'delta': return (f) => delta(arg(f))
            case 'sin': return (f) => Math.sin(arg(f))
            case 'cos': return (f) => Math.cos(arg(f))
            case 'tan': return (f) => Math.tan(arg(f))
            case 'abs': return (f) => Math.abs(arg(f))
            case 'sqrt': return (f) => Math.sqrt(arg(f))
            default: return (f) => 0
        }
    }
    return (f) => 0
}

function generateDataPointsFromFormula(formula) {
    if (!formula || !formula.trim()) {
        return { data: [], minF: -10, maxF: 10, area: 0 }
    }

    try {
        const evalFunc = parse(formula)


        const searchMin = -100
        const searchMax = 100
        const totalPoints = 8000

        const data = []
        const step = (searchMax - searchMin) / totalPoints
        let area = 0
        let lastY = 0

        for (let f = searchMin; f <= searchMax; f += step) {
            const y = evalFunc(f)

            if (!isFinite(y)) continue

            data.push({ x: f, y: y })

            if (data.length > 1) {
                area += (step * (Math.abs(lastY) + Math.abs(y))) / 2
            }
            lastY = y
        }

        const threshold = 1e-4
        let firstIndex = -1
        let lastIndex = -1

        for (let i = 0; i < data.length; i++) {
            if (Math.abs(data[i].y) > threshold) {
                if (firstIndex === -1) {
                    firstIndex = i
                }
                lastIndex = i
            }
        }

        let minF, maxF

        if (firstIndex !== -1) {
            minF = data[firstIndex].x
            maxF = data[lastIndex].x

            const range = maxF - minF
            const padding = (range < 1) ? 5 : range * 0.15

            minF -= padding
            maxF += padding
        } else {
            minF = -10
            maxF = 10
        }


        return { data, minF, maxF, area: Math.round(area * 100) / 100 }

    } catch (error) {
        console.error("Errore nel parsing:", error)
        return { data: [], minF: -10, maxF: 10, area: 0 }
    }
}

const signalChart = new Chart(ctx, {
    type: "scatter",
    data: { datasets: [] },
    options: {
        responsive: true,
        maintainAspectRatio: false
    }
})

function updateChart(config) {
    Object.assign(signalChart.options, config.options)
    signalChart.data.datasets = config.data.datasets
    signalChart.update()
}


function drawSignalFromText() {
    isInteractiveMode = false

    if (formulaCard) {
        formulaCard.style.display = ''
    }

    const formula = functionInput.value
    const { data, minF, maxF, area } = generateDataPointsFromFormula(formula)

    updateChart({
        data: {
            datasets: [{
                label: `S(f) [Area: ${area}]`,
                data,
                borderColor: 'rgb(0, 123, 255)',
                borderWidth: 3,
                showLine: true,
                pointRadius: 0,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    min: minF, max: maxF,
                    title: { display: true, text: 'f' }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Amplitude'
                    }
                }
            },
            plugins: {
                dragdata: { enabled: false },
                zoom: {
                    pan: {
                        enabled: true,
                        mode: 'xy',
                        modifierKey: null
                    },
                    zoom: {
                        wheel: {
                            enabled: true,
                            modifierKey: 'ctrl'
                        },
                        pinch: {
                            enabled: true
                        },
                        mode: 'xy',
                        drag: {
                            enabled: true,
                            backgroundColor: 'rgba(0,0,255,0.1)'
                        }
                    }
                },
                legend: { display: true }
            }
        }
    })
}

plotButton.addEventListener('click', drawSignalFromText)

drawSignalFromText()
