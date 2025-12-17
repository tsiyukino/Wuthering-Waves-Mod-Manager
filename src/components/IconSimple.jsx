// Simple Icon component for custom SVG icons
// Usage: <Icon name="home" size={20} />

import homeIcon from '../assets/icons/home.svg';
import gamesIcon from '../assets/icons/games.svg';
import folderIcon from '../assets/icons/folder.svg';
import tagsIcon from '../assets/icons/tags.svg';
import settingsIcon from '../assets/icons/settings.svg';
import exportIcon from '../assets/icons/export.svg';
import importIcon from '../assets/icons/import.svg';
import addIcon from '../assets/icons/add.svg';
import menuIcon from '../assets/icons/menu.svg';
import closeIcon from '../assets/icons/close.svg';
import searchIcon from '../assets/icons/search.svg';
import deleteIcon from '../assets/icons/delete.svg';
import uploadIcon from '../assets/icons/upload.svg';
import enableIcon from '../assets/icons/enable.svg';
import disableIcon from '../assets/icons/disable.svg';
import moveIcon from '../assets/icons/move.svg';
import findIcon from '../assets/icons/find.svg';
import editIcon from '../assets/icons/edit.svg';
import imageUploadIcon from '../assets/icons/image_upload.svg';

const iconMap = {
  home: homeIcon,
  games: gamesIcon,
  folder: folderIcon,
  tags: tagsIcon,
  settings: settingsIcon,
  export: exportIcon,
  import: importIcon,
  add: addIcon,
  menu: menuIcon,
  close: closeIcon,
  search: searchIcon,
  delete: deleteIcon,
  upload: uploadIcon,
  enable: enableIcon,
  disable: disableIcon,
  move: moveIcon,
  find: findIcon,
  edit: editIcon,
  image_upload: imageUploadIcon,
};

export default function Icon({ name, size = 20, className = "" }) {
  const iconSrc = iconMap[name];
  
  if (!iconSrc) {
    console.warn(`Icon "${name}" not found`);
    return null;
  }

  return (
    <img 
      src={iconSrc}
      alt={name}
      className={`icon ${className}`}
      style={{ 
        width: size, 
        height: size,
        display: 'inline-block',
        verticalAlign: 'middle'
      }}
    />
  );
}
