# How-to add a new custom icon

- Open fontello : https://fontello.com/

- Then click on the 🔧 icon, and click `import` action menu

- Import file `config.json` located in current directory, this should load the current workspace
  icons config into fontello

- Click again on the 🔧 icon, and click `import` action menu

- This time, import the SVG file into fontello, this should add it to the workspace

- For history reasons, don't forget to put your original SVG file into the `custom-svg/` directory

- Prior to exporting, have a look at "Customize names" and "Customize codes" in order to ensure
  that you're not using duplicated code/name for your new icon(s)

- Once done, donwload the zip archive from the website, extract it and :
  
  - Copy updated `config.json` file into current directory
  - Copy archive's `font/*` files into `/public/assets/fonts/fontello/` directory
  - Open archive's `css/fontello.css` file, and extract bottom declarations (`.icon-*` class declarations)
    into `/src/styles/fontello-icons.scss` end, by appending a `vmd` to classnames.
    For example : `.icon-ok-circled2{...}` becomes `.vmdicon-ok-circled2{...}`

- Once done, you should be able to reference your new icons in the components
