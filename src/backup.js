
analysis = () => {
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