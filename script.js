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
    themeToggleButton.addEventListener('click', toggleTheme);
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

function splitTopLevel(expr) {
    const parts = []
    let buf = ""
    let depth = 0

    for (let i = 0; i < expr.length; i++) {
        const ch = expr[i]

        if (ch === "(") {
            depth++
            buf += ch
            continue
        }
        if (ch === ")") {
            depth = Math.max(0, depth - 1)
            buf += ch
            continue
        }
        if ((ch === "+" || ch === "-") && depth === 0) {
            if (buf !== "") {
                parts.push(buf)
                buf = ch
                continue
            }
            buf = ch
            continue
        }
        buf += ch
    }

    if (buf !== "") parts.push(buf)
    console.log("parts:", parts)
    return parts
}


function parseFormula(formula) {
    const signals = []
    if (!formula || !formula.trim()) return signals


    const normalizedFormula = formula.replace(/\(([fFtT])\)/g, (_, v) => `(${v.toLowerCase()}-0)`)
    const compact = normalizedFormula.replace(/\s+/g, '').toLowerCase()

    const parts = splitTopLevel(compact)


    const signalRegex = /^([+-]?\d+(?:\.\d+)?)?\*?(rect|tri)\(\(?([ft])([+-]?\d+(?:\.\d+)?)?\)?\/(\d+(?:\.\d+)?)\)$/;

    parts.forEach((part) => {
        if (!part) return
        let p = part.replace(/\s+/g, '')


        if (/^[+-]?(?:rect|tri)/.test(p)) {
            p = p.replace(/^([+-]?)(?=(rect|tri))/, '$11*')
        }

        const match = p.match(signalRegex)

        if (match) {
            const ampRaw = match[1]
            const amplitude = ampRaw === undefined || ampRaw === '' ? 1 : parseFloat(ampRaw)
            const type = match[2].toLowerCase()
            const varLetter = match[3]
            const centerRaw = match[4]
            const center = centerRaw === undefined || centerRaw === '' ? 0 : -parseFloat(centerRaw)
            const param = parseFloat(match[5])

            signals.push({ amplitude, type, center, param, variable: varLetter })
        } else {
            console.warn(`Sintassi non riconosciuta: "${part}"`)
        }
    })

    return signals
}

function generateDataPointsFromFormula(signals) {
    if (signals.length === 0) {
        return { data: [], minF: -30, maxF: 30, area: 0 }
    }

    let minF = 0
    let maxF = 0

    signals.forEach(s => {
        let halfWidth = 0
        if (s.type === "rect") {
            halfWidth = s.param / 2
        } else {
            halfWidth = s.param
        }
        minF = Math.min(minF, s.center - halfWidth)
        maxF = Math.max(maxF, s.center + halfWidth)
    })
    const padding = Math.max(10, (maxF - minF) * 0.2)
    minF -= padding
    maxF += padding

    const data = []
    const step = (maxF - minF) / 4000

    let area = 0
    let lastY = 0

    for (let f = minF; f <= maxF; f += step) {
        let y = 0

        signals.forEach(s => {
            const halfWidth = s.type === "rect" ? s.param / 2 : s.param
            const relativeF = f - s.center

            if (s.type === "rect") {
                if (Math.abs(relativeF) <= halfWidth) {
                    y += s.amplitude
                }
            } else if (s.type === "tri") {
                if (Math.abs(relativeF) <= halfWidth) {
                    y += s.amplitude * (1 - Math.abs(relativeF) / halfWidth)
                }
            }
        })

        data.push({ x: f, y: y })


        if (data.length > 1) {
            area += (step * (Math.abs(lastY) + Math.abs(y))) / 2
        }
        lastY = y
    }

    return { data, minF, maxF, area: Math.round(area * 100) / 100 }
}


const signalChart = new Chart(ctx, {
    type: "scatter",
    data: { datasets: [] },

    options: {
        responsive: true,
        maintainAspectRatio: false
    }
});


function updateChart(config) {
    Object.assign(signalChart.options, config.options)
    signalChart.data.datasets = config.data.datasets
    signalChart.update()
}

function drawSignalFromText() {
    isInteractiveMode = false;

    if (formulaCard) {
        formulaCard.style.display = '';
    }

    const signals = parseFormula(functionInput.value);
    const { data, minF, maxF, area } = generateDataPointsFromFormula(signals);
    updateChart({
        data: {
            datasets: [{
                label: `S(f) da Formula [Area: ${area}]`,
                data,
                borderColor: 'rgb(0, 123, 255)',
                borderWidth: 3,
                showLine: true,
                pointRadius: 0,
                tension: 0.1,
                stepped: signals.some(s => s.type === 'rect')
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: {
                x: {
                    min: minF, max: maxF,
                    title: { display: true, text: 'f' }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Ampiezza'
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
    });
}

plotButton.addEventListener('click', drawSignalFromText)


drawSignalFromText()
