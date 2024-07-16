# Variation-Markov
Implementation of Variation Markov.

## Dependencies
```
npm install
```


## Generating variations by using Variation Markov
1. Please visit [this page](https://github.com/ChenyuGAO-CS/Variation-Transformer-Data-and-Model) to download the corresponding state transition matrix. 

2. Unzip and copy the state transition matrix files (e.g., ```'pop909_train.json'``` and ```'pop909_train_scl.json'```) into the ```'./state_transition_matrix'``` folder. 

3. Unzip and copy datasets into the ```'./dataset'``` folder. 

4. Using the script ```markov_var_gen_909.js``` to generate variations with state transition matrix extracted from the POP909-TVar dataset.

   Please edit [lines 16-33](https://github.com/ChenyuGAO-CS/Variation-Markov/blob/main/markov_var_gen_909.js#L15-L33) to config paths to the corresponding files. Please modify ```"themeSample"``` in line 24 to change any other themes.

Example usage:

```
node markov_var_gen_909.js -u test
```

Using the script ```markov_var_gen_vgmidi.js``` to generate variations with state transition matrix extracted from the VGMIDI-TVar dataset. Example usage:

```
node markov_var_gen_vgmidi.js -u test
```

## State transition matrix extraction
Please use scripts ```pop_909_preprocess.js``` and ```vgmidi_preprocess.js``` to prepare state transition matrix if you would like to run Variation Markov on your datasets. 

Example usage:

```
node pop_909_preprocess.js -u pop909
```
