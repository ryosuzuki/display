import React from 'react'
import { render } from 'react-dom'
import { createStore } from 'redux'
import _ from 'lodash'
import Slider from 'rc-slider'
import { PrismCode } from 'react-prism'

const data = [
  [
    [0, 0, 0, 1],
    [0, 0, 0, 1],
    [0, 0, 0, 1],
    [0, 0, 0, 1],
  ],
  [
    [0, 0, 0, 1],
    [0, 0, 1, 1],
    [0, 0, 0, 1],
    [0, 0, 0, 1],
  ],
  [
    [0, 0, 0, 1],
    [0, 0, 0, 1],
    [0, 1, 0, 0],
    [0, 0, 0, 1],
  ],
  [
    [0, 0, 0, 1],
    [1, 0, 0, 1],
    [0, 0, 0, 1],
    [1, 1, 0, 1],
  ]
]

const canvas = []
for (let i=0; i<8; i++) {
  let row = []
  for (let j=0; j<8; j++) {
    row.push(0)
  }
  canvas.push(row)
}


class App extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      id: 1,
      step: 0,
      max: 0,
      canvas: '',
      history: [],
      active: false,
    }
    this.init = this.init.bind(this);
    this.play = this.play.bind(this);
    this.update = this.update.bind(this);
    this.toggle = this.toggle.bind(this);
    this.color = this.color.bind(this);
    this.colorClick = this.colorClick.bind(this);
    this.colorMove = this.colorMove.bind(this);
    this.next = this.next.bind(this);
    this.save = this.save.bind(this);
    this.init()
  }

  init () {
    this.state.max = 1
    this.state.canvas = canvas
  }

  toggle () {
    this.state.active = !this.state.active
    this.setState(this.state)
  }

  colorClick (i, j) {
    this.color(i, j)
  }

  colorMove (i, j) {
    if (!this.state.active) return
    this.color(i, j)
  }

  color (i, j) {
    console.log(this.state.canvas[i][j])
    if (this.state.canvas[i][j] === 1) {
      this.state.canvas[i][j] = 0
    } else {
      this.state.canvas[i][j] = 1
    }
    this.setState(this.state)
  }

  next () {
    let canvas = []
    for (let i=0; i<8; i++) {
      let row = []
      for (let j=0; j<8; j++) {
        row.push(this.state.canvas[i][j])
      }
      canvas.push(row)
    }
    this.state.history[this.state.step] = canvas
    this.state.step++
    this.state.max = (this.state.max >= this.state.step) ? this.state.max : this.state.step
    this.setState(this.state)
  }

  save () {
    console.log(this.state.history)
  }

  play () {
    let timer = setInterval(() => {
      if (this.state.max <= this.state.step) {
        clearInterval(timer)
      } else {
        this.state.step++
        console.log(this.state)
        this.update()
      }
    }, 100)
  }

  update (step) {
    if (step) this.state.step = step
    this.state.canvas = this.state.history[this.state.step]
    console.log(this.state.history)
    this.setState(this.state)
  }

  render () {
    return <div>
      <div id="main" className="ui grid">
        <section className="eight wide column">
          <div id="container" onMouseDown={this.toggle} onMouseUp={this.toggle} >
            {this.state.canvas.map( (col, i) => {
              return col.map( (row, j) => {
                if (this.state.canvas[i][j] === 0) {
                  return <div className="cell off" id={`cell-${i}-${j}`} onClick={this.colorClick.bind(this, i, j)} onMouseMove={this.colorMove.bind(this, i, j)}></div>
                } else {
                  return <div className="cell on" id={`cell-${i}-${j}`} onClick={this.colorClick.bind(this, i, j)}></div>
                }
              })
            })}
          </div>
          <br />
          <Slider
            dots
            min={0}
            max={this.state.max}
            value={this.state.step}
            // marks={marks}
            onChange={(value, ui) => {
              value = Math.floor(value)
              this.update(value)
            }}
          ></Slider>
          <br />
          <button className="ui button" onClick={this.play}><i className="fa fa-play"></i></button>
          <button className="ui button" onClick={this.next}><i className="fa fa-right"></i>Next</button>
          <span>{this.state.step}</span>
          <br />
          <br />
          <button className="ui primary button" onClick={this.save}><i className="fa fa-right"></i>Save</button>
        </section>
        <section id="data" className="eight wide column">
          <pre><code>{this.state.history}</code></pre>
        </section>
      </div>
    </div>
  }
}

render(<App />, document.getElementById('root'))

const codeStore = (state, action) => {
  switch (action.typ) {
  case 'ADD':
    return {
      content: action.content
    }
  default:
    return state
  }
}

let store = createStore(codeStore)

const addCode = (content) => {
  return {
    type: 'ADD',
    content: content
  }
}

