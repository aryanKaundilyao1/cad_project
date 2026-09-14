for file in $(find docs/archive -type f -name "*.md"); do
  echo "=== $file ==="
  grep -iE "formula|equation|decay|geometric|noisy|F1|F2|F3|F4|F5|F6|F7|F8|F9|F10|F11|F12|math|confidence" "$file" | head -n 30
done
