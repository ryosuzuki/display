import React from 'react'
import { render } from 'react-dom'
import { createStore } from 'redux'
import _ from 'lodash'
import Slider from 'rc-slider'
import { PrismCode } from 'react-prism'
import Dropzone from 'react-dropzone'
import stringify from 'json-stringify-pretty-compact'
import shortid from 'shortid'
import numeric from 'numeric'
import similarity from 'compute-cosine-similarity'
import rd3 from 'react-d3'

const canvas = []
for (let i=0; i<8; i++) {
  let row = []
  for (let j=0; j<8; j++) {
    row.push(0)
  }
  canvas.push(row)
}

window.initialize = (history) => {
  let data = {}
  for (let i=0; i<64; i++) {
    let col = Math.floor(i / 8)
    let row = i % 8

    let vector = []
    for (let t=0; t<history.length; t++) {
      let prev = (t-1<0) ? 0 : history[t-1][col][row]
      let next = history[t][col][row]

      vector[t] = next - prev
    }
    data[i] = vector
  }
  window.data = data
  return data
}


window.analysis = (data, level) => {
  let group_refs = {}
  let group = {}
  for (let i=0; i<64; i++) {
    let id_i = i
    let id_j = undefined
    let a = data[i]
    let max = 0
    for (let j=i+1; j<64; j++) {
      let b = data[j]
      let s = similarity(a, b)
      if (!isNaN(s) && s > max) {
        max = s
        id_j = j
      }
    }
    if (id_j && max > level) {
      console.log(`${id_i} and ${id_j} have similarity ${max}`)
      let group_id
      if (!group_refs[id_i] && !group_refs[id_j]) {
        group_id = shortid.generate()
      } else if (group_refs[id_i] && !group_refs[id_j]) {
        group_id = group_refs[id_i]
      } else if (!group_refs[id_i] && group_refs[id_j]) {
        group_id = group_refs[id_j]
      } else if (group_refs[id_i] !== group_refs[id_j]) {
        // check for similarity < 1
      }
      group_refs[id_i] = group_id
      group_refs[id_j] = group_id

      if (!group[group_id]) {
        group[group_id] = []
      }
      group[group_id] = _.union(group[group_id], [id_i, id_j])
    }
  }

  window.group = group

  return { group: group, group_refs: group_refs }
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
      group: {},
      group_refs: {},
      group_color: {},
      color_refs: {},
      analyzeMode: false,
      threshold: 0.99,
      data: [],
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
    this.analyze = this.analyze.bind(this);
    this.onDrop = this.onDrop.bind(this);
    this.getColor = this.getColor.bind(this);
    this.init()
  }

  init () {
    this.state.max = 1
    this.state.canvas = canvas

    $.get('/examples/init.json', (res) => {
      console.log(res)
      this.state.history = res
      this.state.step = 0
      this.state.canvas = this.state.history[0]
      this.state.max = this.state.history.length
      this.state.data = window.initialize(this.state.history)
      this.setState(this.state)

    })
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
    // console.log(this.state.canvas[i][j])
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

  onDrop (files) {
    let file = files[0]
    $.get(file.preview, (res) => {
      console.log(res)
      this.state.history = res
      this.state.step = 0
      this.state.canvas = this.state.history[0]
      this.state.max = this.state.history.length
      this.setState(this.state)
    })
  }

  save () {
    let data = stringify(this.state.history)
    let blob = new Blob([data], {type: 'text/plain;charset=utf-8'})
    saveAs(blob, `history-${Date.now()}.json`)
  }

  analyze () {
    this.state.analyzeMode = true

    let { group, group_refs } = window.analysis(this.state.data, this.state.threshold)
    console.log(stringify(group))
    console.log(stringify(group_refs))
    this.state.group = group
    this.state.group_refs = group_refs
    window.group_refs = group_refs

    let col = ["#3366cc", "#dc3912", "#ff9900", "#109618", "#990099", "#0099c6", "#dd4477", "#66aa00", "#b82e2e", "#316395", "#994499", "#22aa99", "#aaaa11", "#6633cc", "#e67300", "#8b0707", "#651067", "#329262", "#5574a6", "#3b3eac"];
    let i = 0
    let group_color = {}
    let color_refs = {}
    Object.keys(group).forEach( (group_id) => {
      if (!group_color[group_id]) {
        group_color[group_id] = col[i]
        i++
      }
    })
    Object.keys(group_refs).forEach( (id) => {
      let group_id = group_refs[id]
      color_refs[id] = group_color[group_id]
    })
    console.log(stringify(group_color))
    console.log(stringify(color_refs))
    this.state.group_color = group_color
    this.state.color_refs = color_refs

    this.setState(this.state)
  }

  play () {
    this.state.step = 0
    this.setState(this.state)
    let timer = setInterval(() => {
      if (this.state.max <= this.state.step) {
        clearInterval(timer)
      } else {
        this.state.step++
        // console.log(this.state)
        this.update()
      }
    }, 100)
  }

  update (step) {
    if (step !== undefined) this.state.step = step
    this.state.canvas = this.state.history[this.state.step]
    // console.log(this.state.history)
    this.setState(this.state)
  }

  getColor (i, j) {
    let id = 8*i+j
    let group_id = this.state.group_refs[id]

    return 'red'
  }

  changeThreshold (event) {
    console.log(event.target.value)
    this.state.threshold = event.target.value
    this.analyze()
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
                  return <div className="cell off" id={`cell-${8*i+j}`} onClick={this.colorClick.bind(this, i, j)} onMouseMove={this.colorMove.bind(this, i, j)}></div>
                } else if (!this.state.analyzeMode) {
                  return <div className={`cell on ${this.state.group_refs[8*i+j]}`} id={`cell-${8*i+j}`}  onClick={this.colorClick.bind(this, i, j)}></div>
                } else {
                  return <div className={`cell on ${this.state.group_refs[8*i+j]}`} id={`cell-${8*i+j}`} style={{ background: this.state.color_refs[8*i+j] }} onClick={this.colorClick.bind(this, i, j)}></div>
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
          <button className="ui primary button" onClick={this.save}>Save</button>
          <br />
          <br />
          <div className="ui left action input">
            <button className="ui grey button" onClick={this.analyze}>Analyze</button>
            <input type="text" value={this.state.threshold} onChange={this.changeThreshold.bind(this)} />
          </div>
          <br />
          <If condition={this.state.analyzeMode}>
            { Object.keys(this.state.group_color).map( (key) => {
              let color = this.state.group_color[key]
              let ids = this.state.group[key]
              return <div style={{float: 'left', width: '100%'}}>
                <div className="cell" style={{ background: color }}></div>
                <span>{stringify(ids)}</span>
              </div>
            }) }
          </If>
        </section>
        <section id="data" className="eight wide column">
          <pre id="output"><code className="language-history">{stringify(this.state.history)}</code>
          </pre>
          <Dropzone onDrop={this.onDrop}>
            Drop JSON data here
          </Dropzone>
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






