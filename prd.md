# Mind mapping tool with VIM like key binding

I often use mind mpas and schemas to better think about some problem, but when I do it by hand it is hard to modify it later, and when I do it with a software tool, I often find the tools too complex or not flexible enough.

I wan to create mind map tool that will be really fast and simple to use, main usage/interactions will be through VIM like key bindings.

It will be web based app build in React

## Example

simple mind map schema with 1 parent and 3 children nodes

```
                           +-------+
                           | Child1|
                      |--- +-------+
                      |
          +-------+   |    +------+
          | Parent|--- ----| Child2|
          +-------+   |    +------+
                      |
                      |--- +-------+
                           | Child3|
                           +-------+
```

How the interaction will look like:

- some node is always focused/selected - this is visible by some color outline
- when focus is on parent - pressing `l` or `h` key will move focus to first child node or to parent node respectivel
- pressing `j` or `k` key will move focus to next/previous sibling node
- pressing `a` key will create new child node to focused node and move focus to it
- pressing `o` key will create new sibling node to focused node and move focus to it
- pressing `d` key will delete focused node (if it has no children)
- pressing `gd` will delete node and all its children
- pressing `i` key will enter "insert mode" where user can type text to edit node content, pressing `Esc` will exit insert mode - as in vim we can pres `cin` to delete current node content and enter insert mode directly
- pressing`/` will enter "search mode" where user can type text to search for node content, pressing `n` or `N` will move focus to next/previous found node
  - search mode should open some picker where user can type and we will fuzzy match the node based on content and show all possible suggestion - using arrows we can move through suggestions and this will previous/show the node in the mind map
  - `Enter` confirm selection
  - `Esc` exit search mode and restore focus on existing focused node
- the app has to have vim modes: normal, insert are enough for now. Current mode will be somewhere visible in the UI
- there will be command palette available (Cmd+K shortcut):
  - it will contain all commands that can be triggered by key bindings as well
  - and maybe some other stuff as well
- Technical requirments:
  - keyboard shortcuts should be handled globally and it should be easy to add a new shortcut
    - shortcut will be mostly bind to some command - which must be in commadn palete but also triggered by keyboard or some UI acttion (eg. button on node in the mind map)
  - commands should be customizable/enhanced by current context (similar to what Linear has) - eg. when I have one node focused I can delete/edit that node or create children/siblings in relation to that node,...)
- The entire app should be build in a way that most logic is decoupled from UI - so it will be easy to change UI framework or create mobile app in the future or just test that everything works without UI
- It should be also build with domain driven design principles in mind - so the core logic is in its own domain and can be reused in other apps or contexts and that we can easily extend the app in the future
  - possible extension points:
    - different charts/diagrams (eg. mermaid, flowcharts, org charts,...)
      - different node types (eg. image node, todo node, ...)
    - different layout algorithms (eg. tree layout, radial layout,...)
    - collaboration/multi user support
    - export/import to different formats (eg. mermaid, markdown, json, ...)
    - integration with other tools (eg. notion, figma,...)
    - more commands (in command palette, with keybinding, available via some button,...)
- before writing UI - create and write core logic that will then be connected to the UI (React) - write it in a way that we can later easily integrate it with React UI.
- keep dependency injection and inverison in mind so the code is easy to test and bootstrap.

## Tech stack

- React
- Tailwind CSS
- Shadcn UI - if necessary
- chart/diagram library: either [React flow lib](https://reactflow.dev/) if you think it will be worth it or maybe some custom solution. Requirments for it:
  - speed and performance - app must feel fluid
  - customization and good look
  - maintainability and extensibility of the solution

## Apps to use as a reference or source for technical investigation

- [n8n](https://github.com/n8n-io/n8n) - check how they implement canvas and works with the nodes
- [exalidraw](https://github.com/excalidraw/excalidraw) - online whiteboard tool with simple UI and keyboard shortcuts
