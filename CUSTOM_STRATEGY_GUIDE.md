# Custom Mod Management Strategy Guide

## Overview

This guide explains how to create custom mod management strategies for specific games. A mod management strategy defines how mods are enabled and disabled for a particular game.

## Built-in Strategies

### 1. Generic (Folder Move)
- **Enable**: Moves mod folder from `{root}/_{DisabledFolder}/` back to `{root}/`
- **Disable**: Moves mod folder from `{root}/` to `{root}/_{DisabledFolder}/`
- **Best for**: Most games that load mods from a specific folder

### 2. Wuthering Waves (File Rename)
- **Enable**: Removes `.bak` extension from all `.ini` files in the mod folder
- **Disable**: Adds `.bak` extension to all `.ini` files in the mod folder
- **Best for**: Games using GIMI/3DMigoto framework

## Creating Custom Strategies

### Strategy File Format

Create a JSON file with the following structure:

```json
{
  "name": "My Custom Strategy",
  "id": "my_custom_strategy",
  "description": "Description of what this strategy does",
  "version": "1.0.0",
  "author": "Your Name",
  "enable": {
    "type": "file_rename",
    "pattern": "*.pak",
    "action": {
      "remove_suffix": ".disabled"
    }
  },
  "disable": {
    "type": "file_rename",
    "pattern": "*.pak",
    "action": {
      "add_suffix": ".disabled"
    }
  }
}
```

### Strategy Types

#### 1. File Rename Strategy

Renames files to enable/disable mods:

```json
{
  "enable": {
    "type": "file_rename",
    "pattern": "*.ini",
    "recursive": true,
    "action": {
      "remove_suffix": ".bak"
    }
  },
  "disable": {
    "type": "file_rename",
    "pattern": "*.ini",
    "recursive": true,
    "action": {
      "add_suffix": ".bak"
    }
  }
}
```

**Options:**
- `pattern`: File glob pattern (e.g., `*.ini`, `*.pak`, `config.json`)
- `recursive`: Search in subdirectories (true/false)
- `action`:
  - `add_suffix`: Add text to end of filename
  - `remove_suffix`: Remove text from end of filename
  - `add_prefix`: Add text to start of filename
  - `remove_prefix`: Remove text from start of filename

#### 2. Folder Move Strategy

Moves entire mod folder:

```json
{
  "enable": {
    "type": "folder_move",
    "from": "{root}/_Disabled/{mod_name}",
    "to": "{root}/{mod_name}"
  },
  "disable": {
    "type": "folder_move",
    "from": "{root}/{mod_name}",
    "to": "{root}/_Disabled/{mod_name}"
  }
}
```

**Variables:**
- `{root}`: Game's mod root folder
- `{mod_name}`: Name of the mod folder
- `{disabled_folder}`: Disabled folder name from settings

#### 3. File Content Strategy

Modifies file contents:

```json
{
  "enable": {
    "type": "file_content",
    "file": "config.ini",
    "action": {
      "find": "enabled=false",
      "replace": "enabled=true"
    }
  },
  "disable": {
    "type": "file_content",
    "file": "config.ini",
    "action": {
      "find": "enabled=true",
      "replace": "enabled=false"
    }
  }
}
```

#### 4. Registry Strategy (Windows Only)

Modifies Windows registry:

```json
{
  "enable": {
    "type": "registry",
    "key": "HKEY_CURRENT_USER\\Software\\Game\\Mods",
    "value_name": "{mod_name}",
    "value_data": "1",
    "value_type": "DWORD"
  },
  "disable": {
    "type": "registry",
    "key": "HKEY_CURRENT_USER\\Software\\Game\\Mods",
    "value_name": "{mod_name}",
    "value_data": "0",
    "value_type": "DWORD"
  }
}
```

**Warning:** Registry strategies require administrator privileges and should be used carefully.

### Example Strategies

#### Skyrim Special Edition

```json
{
  "name": "Skyrim Special Edition",
  "id": "skyrim_se",
  "description": "Manages Skyrim SE mods by enabling/disabling .esp/.esm files",
  "enable": {
    "type": "file_rename",
    "pattern": "*.es[pm]",
    "recursive": false,
    "action": {
      "remove_suffix": ".disabled"
    }
  },
  "disable": {
    "type": "file_rename",
    "pattern": "*.es[pm]",
    "recursive": false,
    "action": {
      "add_suffix": ".disabled"
    }
  }
}
```

#### Minecraft (Fabric/Forge)

```json
{
  "name": "Minecraft Mods",
  "id": "minecraft_mods",
  "description": "Manages Minecraft mods by moving .jar files",
  "enable": {
    "type": "file_rename",
    "pattern": "*.jar.disabled",
    "recursive": false,
    "action": {
      "remove_suffix": ".disabled"
    }
  },
  "disable": {
    "type": "file_rename",
    "pattern": "*.jar",
    "recursive": false,
    "action": {
      "add_suffix": ".disabled"
    }
  }
}
```

#### Unreal Engine 4/5 Games

```json
{
  "name": "Unreal Engine Pak",
  "id": "unreal_pak",
  "description": "Manages UE4/5 .pak file mods",
  "enable": {
    "type": "file_rename",
    "pattern": "*.pak",
    "recursive": false,
    "action": {
      "remove_suffix": "_disabled"
    }
  },
  "disable": {
    "type": "file_rename",
    "pattern": "*.pak",
    "recursive": false,
    "action": {
      "add_suffix": "_disabled"
    }
  }
}
```

## Installing Custom Strategies

1. Create your strategy JSON file
2. Click the **+** button next to "Mod Management Strategy" in Settings
3. Select your strategy JSON file
4. The strategy will be added to the dropdown menu
5. Select it to use it for the current game

## Strategy Storage

Custom strategies are stored in:
- Windows: `%APPDATA%/ModManager/strategies/`
- Linux/Mac: `~/.local/share/ModManager/strategies/`

## Testing Your Strategy

1. Create a test game profile
2. Add a test mod
3. Try enabling/disabling it
4. Verify the mod files are modified correctly
5. Make sure the game recognizes the changes

## Advanced Features

### Conditional Actions

Execute different actions based on file existence:

```json
{
  "enable": {
    "type": "conditional",
    "conditions": [
      {
        "if": "file_exists('{root}/{mod_name}/enabled.flag')",
        "then": {
          "type": "file_delete",
          "file": "enabled.flag"
        },
        "else": {
          "type": "file_create",
          "file": "enabled.flag",
          "content": "1"
        }
      }
    ]
  }
}
```

### Script Execution

Run custom scripts (use with caution):

```json
{
  "enable": {
    "type": "script",
    "command": "python enable_mod.py \"{root}\" \"{mod_name}\"",
    "working_directory": "{root}"
  }
}
```

**Security Warning:** Script execution can be dangerous. Only use scripts from trusted sources.

## Troubleshooting

### Common Issues

1. **Mod doesn't enable/disable:**
   - Check file patterns match actual filenames
   - Verify paths are correct
   - Check file permissions

2. **Game doesn't recognize changes:**
   - Some games cache mod lists
   - Try restarting the game
   - Check if game uses a different method to load mods

3. **Files not found:**
   - Make sure the root folder is set correctly
   - Check if the game stores mods in subdirectories
   - Verify file extensions are correct

## Best Practices

1. **Test thoroughly** before using on important mod setups
2. **Backup** your mod folder before testing new strategies
3. **Document** your strategy so others can use it
4. **Share** working strategies with the community
5. **Version control** your strategy files

## Contributing

Share your custom strategies:
1. Test them thoroughly
2. Document what game they're for
3. Submit them to the community repository
4. Help others who want to use the same strategy

## Support

For help creating custom strategies:
- Check the examples above
- Ask in the community forums
- Open an issue on GitHub
- Consult the game's modding documentation

## Future Enhancements

Planned features for custom strategies:
- Visual strategy builder
- Strategy marketplace
- Auto-detection of game mod systems
- Multi-step strategies
- Strategy templates
- Better error reporting
