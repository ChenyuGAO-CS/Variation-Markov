# Variation-Markov
Implementation of Variation Markov.

## Dependencies
```
npm install
```


## Generating variations by using Variation Markov
Please visit [this page](https://github.com/ChenyuGAO-CS/Variation-Transformer-Data-and-Model) to download the corresponding state transition matrix. 

Unzip and copy the state transition matrix files (e.g., ```'pop909_train.json'``` and ```'pop909_train_scl.json'```) into the ```'./state_transition_matrix'``` folder. 

Unzip and copy datasets into the ```'./dataset'``` folder. 

Using the script ```markov_var_gen_909.js``` to generate variations. Please edit [lines 16-33](https://github.com/ChenyuGAO-CS/Variation-Markov/blob/main/markov_var_gen_909.js#L15-L33) to config paths to the corresponding files. 
Example usage:

```
node markov_var_gen_909.js -u test
```

Using the script ```markov_var_gen_vgmidi.js``` to generate variations. Example usage:

```
node markov_var_gen_vgmidi.js -u test
```

## State transition matrix extraction
Please use scripts ```pop_909_preprocess.js``` and ```vgmidi_preprocess.js``` to prepare state transition matrix if you would like to run Variation Markov on your datasets. 

Example usage:

```
node pop_909_preprocess.js -u pop909
```
