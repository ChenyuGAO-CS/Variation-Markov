// Requires
const argv = require('minimist')(process.argv.slice(2))
const path = require("path")
const mu = require("maia-util")
const mm = require('maia-markov')
const an = new mm.Analyzer()
const gn = new mm.Generator()
const fs = require("fs")
const { Midi } = require('@tonejs/midi')
const sr = require('seed-random')

// const seed = "hello683482"
// sr(seed, {global: true})

const mainPaths = {
  "test": {
    "inStm": path.join(
      __dirname, "state_transition_matrix/pop909_train.json"
    ),
    "midi": path.join(
      __dirname, "dataset/POP909-TVar"
    ),
    "midiDir": "test",
    "themeSample": ["623_A_0.mid"],
    "sclPath": path.join(
      __dirname, "state_transition_matrix"
    ),
    "sclName": "pop909_train_scl.json",
    "outputDir": path.join(
      __dirname, "out"
    ),
  }
}

let param = {
  "stateType": "beat_rel_sq_MNN_state",
  "pointReconstruction": "rel_sq_MNN",
  "timeSignatures": [ {"barNo": 1, "topNo": 4, "bottomNo": 4, "ontime": 0} ],
  "stm": null,
  "initial": null,
  "nosConsecutives": 4,
  "ontimeUpperLimit": 16,
  "squashRangeMidiMorph": [12, 7],
  "indices": {
    "ontime": 0, "MNN": 1, "MPN": 2, "duration": 3, "channel": 4, "velocity": 5
  },
  "randCount": 0,
  "midiExport": {
    "scaleFactor": 0.5,
    "timeSigTopNo": 4,
    "timeSigBottomNo": 4,
    "noteIndices": {
      "ontimeIndex": 0,
      "mnnIndex": 1,
      "durationIndex": 3,
      "channelIndex": 4,
      "velocityIndex": 5
    },
    "ccIndices": {
      "ontimeIndex": 0,
      "numberIndex": 1,
      "channelIndex": 2,
      "valueIndex": 3
    }
  },
  "downbeat": {
    "histType": "drumsFalseVelocityTrue",
    "drumsOnly": false,
    "rounding": true,
    "granularity": 4,
    "beatsInMeasure": 4,
    "velocityIndex": 4,
    "ontimeIndex": 0
  },
  "ontimeIndex": 0,
  "noteIndices": {
    "ontimeIndex": 0,
    "mnnIndex": 1,
    "durationIndex": 3,
    "channelIndex": 4,
    "velocityIndex": 5
  },
  "controlChanges": null,
  "scaleFactor": 0.5,
  "timeSigtopNo": 4,
  "timeSigBottomNo": 4
}

// Grab user name from command line to set path to stm.
const mainPath = mainPaths[argv.u]
const dataEx = require(mainPath["inStm"])

const out_dir = mainPath["outputDir"]
try {
  if (!fs.existsSync(out_dir)){
    fs.mkdirSync(out_dir);
  }
} catch (err) {
  console.error(err);
}

let g = new mm.Graph()
dataEx.map(function(d){
  const contnCount = count_continuations(d.continuations, "beat_rel_sq_MNN_state")
  d.continuations.map(function(nb){
    if(d.beat_rel_sq_MNN_state[0]<nb.beat_rel_sq_MNN_state[0]){
      g.add_directed_edge(an.state2string(d.beat_rel_sq_MNN_state), an.state2string(nb.beat_rel_sq_MNN_state), 1/contnCount)
    }
  })
})

// Trying to run the code over all themes in the test set, and check if there is any output.
let midiDirs = fs.readdirSync(path.join(mainPath["midi"], mainPath["midiDir"]))
// Filter out themes in the testing set.
midiDirs = midiDirs.filter(function(fnam){
  let tmpSongNumber = fnam.split(".")[0]
  let splitSongNumber = tmpSongNumber.split("_")
  tmpSongNumber = splitSongNumber[splitSongNumber.length-1]
  if(path.extname(fnam) === ".mid" && tmpSongNumber === "0"){
    return true
  }
})

// Comment this lines 124-127 if you would like to generate variations for the whole test set.
midiDirs = midiDirs.filter(function(midiDir){
    return mainPath["themeSample"].indexOf(midiDir) >= 0
})
// console.log(midiDirs)

midiDirs
.forEach(function(midiDir, jDir){
  // Obtain states from a theme.
  console.log("midiDir", midiDir)
  const midiData = fs.readFileSync(
    path.join(mainPath["midi"], mainPath["midiDir"], midiDir)
  )
  const midi = new Midi(midiData)
  console.log("midi.header", midi.header)
  const tmp_bpm = midi.header.tempos
  const timeSigs = [{"barNo": 1, "topNo": 4, "bottomNo": 4, "ontime": 0}]
  if (timeSigs[0].topNo !== 4){
    console.log("timeSigs:", timeSigs)
  }
  let allPoints = []
  midi.tracks.forEach(function(track, idx){
    const trgTestStr = track.instrument.family + " -> " + track.instrument.name
    console.log("trgTestStr:", trgTestStr)
    // console.log("track.instrument.family:", track.instrument.family)
    // console.log("track.instrument.name:", track.instrument.name)
    track.notes.forEach(function(n){
      let pt = [
        n.ticks/midi.header.ppq,
        n.midi,
        n.durationTicks/midi.header.ppq,
        track.channel,
        Math.round(1000*n.velocity)/1000
      ]
      allPoints.push(pt)
    })
  })

  // Key detection
  const fsm = mu.fifth_steps_mode(allPoints, mu.krumhansl_and_kessler_key_profiles)
  // console.log("fsm:", fsm)
  allPoints.forEach(function(p){
    p.splice(2, 0, mu.guess_morphetic(p[1], fsm[2], fsm[3]))
  })
  let comp = an.note_point_set2comp_obj(
    allPoints, timeSigs, false, [0, 1/4, 1/3, 1/2, 2/3, 3/4, 1]//, [0, 1/6, 1/4, 1/3, 1/2, 2/3, 3/4, 5/6, 1]
  )
  let current_state = an.comp_obj2beat_rel_sq_mnn_states(comp)
  // console.log("current_state", current_state)

  for(let var_idx = 0; var_idx < 1; var_idx ++){
    // Perhaps we could try to obtain the beginning and the end states of each measure, 
    // and try to find scenic_path().
    let beg_idx = 0
    let end_idx = 0
    let full_sc_pair = []
    for(let i = 0; i < current_state.length; i ++){
      if(i === current_state.length-1){
        end_idx = i
        const beginning_state = an.state2string(current_state[beg_idx].beat_rel_sq_MNN_state)
        const end_state = an.state2string(current_state[end_idx].beat_rel_sq_MNN_state)
        const path3 = g.print_scenic_path(beginning_state, end_state, 0.5)
        // console.log("path3", path3)
        if(path3 !== undefined && Math.random() > 0.5){
          const sc_pair = path2sc_pairs(path3, mainPath['sclName'])
          full_sc_pair.push(current_state[beg_idx])
          for(let j = 1; j < sc_pair.length - 1; j ++){
            full_sc_pair.push(sc_pair[j])
          }
          full_sc_pair.push(current_state[end_idx])
        }
        else{
          for(let j = beg_idx; j <= end_idx; j ++){
            full_sc_pair.push(current_state[j])
          }
        }
      }
      else if(current_state[i+1].beat_rel_sq_MNN_state[0]<current_state[i].beat_rel_sq_MNN_state[0]){
        end_idx = i
        const beginning_state = an.state2string(current_state[beg_idx].beat_rel_sq_MNN_state)
        const end_state = an.state2string(current_state[end_idx].beat_rel_sq_MNN_state)
        const path3 = g.print_scenic_path(beginning_state, end_state, 0.5)
        // console.log("path3", path3)
        if(path3 !== undefined && Math.random() > 0.5){
          const sc_pair = path2sc_pairs(path3, mainPath['sclName'])
          full_sc_pair.push(current_state[beg_idx])
          for(let j = 1; j < sc_pair.length - 1; j ++){
            full_sc_pair.push(sc_pair[j])
          }
          full_sc_pair.push(current_state[end_idx])
        }
        else{
          for(let j = beg_idx; j <= end_idx; j ++){
            full_sc_pair.push(current_state[j])
          }
        }
        beg_idx = i + 1
      }
    }
    console.log(full_sc_pair.length)


    let points = gn.get_points_from_states(full_sc_pair, param)
    points = points.map(function(p){
      p[param.indices.MNN] += full_sc_pair[0].context.tonic_pitch_closest[0] //60
      p[param.indices.MPN] += full_sc_pair[0].context.tonic_pitch_closest[1] //60
      p[param.indices.channel] = 0
      return p
    })
    // console.log("p", points.slice(0,5))

    // Write tempo in MIDI.
    const midiOut = new Midi()
    let ntracks = 1
    const tmp_out_points = points
    const tmp_out_bpm = tmp_bpm
    for (let i_track = 0; i_track < ntracks; i_track++){
      const track = midiOut.addTrack()
      track.name = "Piano"
      track["channel"] = i_track
      tmp_out_points.forEach(function(p){
        track.addNote({
          midi: p[param.noteIndices.mnnIndex],
          time: param.scaleFactor*(p[param.noteIndices.ontimeIndex]),
          duration: param.scaleFactor*p[param.noteIndices.durationIndex],
          velocity: p[param.noteIndices.velocityIndex]
        })
      })
    }
    midiOut.header.tempos = tmp_bpm
    const song_name = midiDir.split('.')[0]

    const folder_out = path.join(mainPath["outputDir"], var_idx.toString())
    try {
      if (!fs.existsSync(folder_out)){
        fs.mkdirSync(folder_out);
      }
    } catch (err) {
      console.error(err);
    }
    fs.writeFileSync(
      path.join(mainPath["outputDir"], var_idx.toString(), song_name + "_markovVar" + ".mid"),
      new Buffer.from(midiOut.toArray())
    )
  }
})




// Other functions.
function count_continuations(contn, stateType){
  const states = contn.map(function(c){ return c[stateType] })
  return mu.count_rows(states, undefined, true)
}

function path2sc_pairs(pathArr, sclFnam, maxOn){
  // Loading sclFile.
  const sclData = require(path.join(mainPath["sclPath"], sclFnam))
  let sc_pairs = []
  // Select one object randomly from "context"
  let tmpMaxOn = -1
  for(let i = 0; i < pathArr.length; i ++){
    let p = pathArr[i]
    // console.log("p", p)
    let beat_rel_sq_MNN_state = an.string2state(p)
    if(p in sclData){
      let length_sclData = sclData[p].length
      let sel_context = sclData[p][getRandomInt(length_sclData)]
      if(beat_rel_sq_MNN_state[0]>= maxOn){
        break
      }
      sc_pairs.push({"beat_rel_sq_MNN_state": beat_rel_sq_MNN_state, "context": sel_context})
    }
    
  }
  // console.log("sc_pairs", sc_pairs)
  return sc_pairs
}

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}
