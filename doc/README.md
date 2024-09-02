## Data structures
Required keys end with *.

- ### Graph Data
```
graph = [{
  id*: Int,
  name*: String,
  type* : String,
  hub: [...ids],
  sub; [...ids],
  inputs: [...ids],
  outputs: [...ids]
}]
```
#### Example
```JSON
{
    "id": "1",
    "name": "theme_widget",
    "type": "comp",
    "comp": "theme_widget",
    "hub": [
        "0"
    ],
    "sub": [
        "11",
        "10"
    ],
    "inputs": [
        56,
        42
    ]
}
```

- ### State Data
```
state = [{
  id*: int,
  sub: {
    component_name: id || [...ids]
    .
    .
  }
}]
```
#### Example
```JSON
{
    "id": "8",
    "comp": "our_contributors",
    "sub": {
        "content": "15",
        "contributor": [
            "16",
            "17",
            "18"
        ]
    }
}
```
- ### Theme Data
This is unique and old maybe. The array indexes are used as IDs.
```
index = {
  theme_name: ['file1.css', 'file2.css', ....]
}
theme_name = ['file1_content', 'file2_content', ....]
```
#### Example
```JSON
{
  "theme": [
    "div{\n  display: none;\n}"
  ],
  "index": [
    "uniq2"
  ]
}
```

