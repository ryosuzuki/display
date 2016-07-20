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

const canvas = []
for (let i=0; i<8; i++) {
  let row = []
  for (let j=0; j<8; j++) {
    row.push(0)
  }
  canvas.push(row)
}


window.analysis = (history) => {


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
  window.similarity = similarity
  // console.log(stringify(data))


  let group_ref = {}
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
    if (id_j) {
      console.log(`${id_i} and ${id_j} have similarity ${max}`)
      let group_id
      if (!group_ref[id_i] && !group_ref[id_j]) {
        group_id = shortid.generate()
      } else if (group_ref[id_i] && !group_ref[id_j]) {
        group_id = group_ref[id_i]
      } else if (!group_ref[id_i] && group_ref[id_j]) {
        group_id = group_ref[id_j]
      } else if (group_ref[id_i] !== group_ref[id_j]) {
        // check for similarity < 1
      }
      group_ref[id_i] = group_id
      group_ref[id_j] = group_id

      if (!group[group_id]) {
        group[group_id] = []
      }
      group[group_id] = _.union(group[group_id], [id_i, id_j])
    }
  }

  window.group = group

  return group

  /*
    convert (row, col) to id
    e.g. [4, 2] -> 35
   */
  const id_history = []
  for (let t=0; t<history.length; t++) {
    let canvas = history[t]
    let ids = []
    for (let i=0; i<8; i++) {
      let col = canvas[i]
      for (let j=0; j<8; j++) {
        let bool = col[j]
        if (bool === 1) {
          let id = 8*i + j + 1
          ids.push(id)
        }
      }
    }
    id_history.push(ids)
  }
  // console.log(id_history)

  /*
    get only new id
    e.g.
    35                         -> 35
    35, 36                     -> 36
    35, 36, 43, 44             -> 43, 44
    26, 34, 35, 36, 42, 43, 44 -> 26, 34, 42
    ...
   */
  const new_history = []
  const checked = []
  for (let t=0; t<history.length; t++) {
    let ids = id_history[t]
    let new_ids = []
    ids.forEach( (id) => {
      if (!checked.includes(id)) {
        new_ids.push(id)
        checked.push(id)
      }
    })
    new_history.push(new_ids)
  }
  // console.log(stringify(new_history))

  /*
    get plus and minus ids
    e.g.
    35, 40, 41                 -> 35, 40, 41 |
    35, 36                     -> 36         | 40, 41
    35, 36, 48, 49             -> 48, 49     |
    26, 34, 35, 36, 42, 43, 44 -> 26, 34, 42 | 48, 49
                                  43, 44     |
    ...
  */

  const plus_history = []
  const minus_history = []
  for (let t=0; t<history.length; t++) {
    let prev_ids = (t-1 < 0) ? [] : id_history[t-1]
    let next_ids = id_history[t]
    let plus_ids = _.difference(next_ids, prev_ids)
    let minus_ids = _.difference(prev_ids, next_ids)
    plus_history.push(plus_ids)
    minus_history.push(minus_ids)
  }
  // console.log(stringify(plus_history))
  // console.log(stringify(minus_history))

  function isInclude(groups, ids) {
    let bool = false
    ids.forEach( (id) => {
      let group_id = groups[id]
    })
    // groups.forEach( (group) => {
    //   if (_.isEqual(group, ids)) bool = true
    // })
    return bool
  }

  let groups = {}
  function assignGroup(ids) {
    let group_id = shortid.generate()
    ids.forEach( (id) => {
      groups[id] = group_id
    })
  }

  let check = []
  function updateGroups(groups, ids) {
    assignGroup(ids)
    check = _.union(check, ids)
  }

  for (let t=0; t<history.length; t++) {
    let plus_ids = plus_history[t]
    updateGroups(groups, plus_ids)
    let minus_ids = plus_history[t]
    updateGroups(groups, minus_ids)
  }
  // console.log(stringify(groups))
  window.groups = groups

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
    this.onDrop = this.onDrop.bind(this);
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
      this.setState(this.state)

      let group = window.analysis(this.state.history)
      console.log(stringify(group))

      Object.keys(group).forEach( (key) => {
        let ids = group[key]

        ids.forEach( (id) => {
          console.log(id, key)
          $(`.on#cell-${id}`)
          .addClass(key)
          .css('background', 'red')
        })
      })

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

  play () {
    this.state.step = 0
    this.setState(this.state)
    let timer = setInterval(() => {
      if (this.state.max < this.state.step) {
        clearInterval(timer)
      } else {
        this.state.step++
        console.log(this.state)
        this.update()
      }
    }, 100)
  }

  update (step) {
    if (step !== undefined) this.state.step = step
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
                  return <div className="cell off" id={`cell-${8*i+j}`} onClick={this.colorClick.bind(this, i, j)} onMouseMove={this.colorMove.bind(this, i, j)}></div>
                } else {
                  return <div className="cell on" id={`cell-${8*i+j}`} onClick={this.colorClick.bind(this, i, j)}></div>
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

