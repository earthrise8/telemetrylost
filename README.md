# Telemetry Lost
A fan made web game inspired by the world of Mickey-7 by Edward Ashton

## How to Add a New Item

1.  **Open `script.js`**
2.  **Find the `itemData` object:** This object contains all the items in the game.
3.  **Add a new entry:** The key should be the item's name, and the value should be an object with the following properties:
    *   `type`: The type of item (`suit`, `tool`, `sample`, `misc`).
    *   `cost`: The cost of the item in the store (if applicable).
    *   `desc`: A description of the item.
    *   `sell`: The value of the item when sold at the base (if applicable).

**Example:**

```javascript
'Strange Artifact': { type: 'misc', desc: 'A strange, pulsating artifact. It feels warm to the touch.' }
```

## How to Add a New Location

1.  **Open `script.js`**
2.  **Find the `poiMap` object:** This object contains the coordinates and names of all the points of interest on the map.
3.  **Add a new entry:** The key should be a unique identifier for the location, and the value should be an object with the following properties:
    *   `x`: The x-coordinate of the location on the map.
    *   `y`: The y-coordinate of the location on the map.
    *   `name`: The name of the location to be displayed on the map.

**Example:**

```javascript
'crystalCave': { x: 1, y: 8, name: 'Cave' }
```

4.  **Find the `events` object:** This object contains the events that can be triggered at each location.
5.  **Add a new entry:** The key should be the same unique identifier used in `poiMap`. The value should be an array of event objects, each with the following properties:
    *   `text`: The text to be displayed when the event is triggered.
    *   `actions`: An array of action objects, each with a `label` and a `func` to be called when the action button is clicked.

**Example:**

```javascript
events.crystalCave = [
    {
        text: "A vast cavern of shimmering crystals.",
        actions: [
            { label: "Collect Crystal Sample", func: collectCrystalSample }
        ]
    }
];
```
