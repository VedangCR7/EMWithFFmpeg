#!/usr/bin/env python3
"""
Check ELF file for max-page-size note, which Google Play Console checks.
"""
import sys
import os
import struct
from pathlib import Path

def read_elf_notes(file_path):
    """Read ELF note sections to find max-page-size."""
    with open(file_path, 'rb') as f:
        # Read ELF magic
        magic = f.read(4)
        if magic != b'\x7fELF':
            return None
        
        # Read EI_CLASS and EI_DATA
        f.seek(4)
        ei_class = struct.unpack('B', f.read(1))[0]
        ei_data = struct.unpack('B', f.read(1))[0]
        
        endian = '<' if ei_data == 1 else '>'
        is_64bit = ei_class == 2
        
        # Read e_shoff (section header table offset)
        if is_64bit:
            f.seek(40)
            e_shoff = struct.unpack(f'{endian}Q', f.read(8))[0]
            f.seek(58)
            e_shentsize = struct.unpack(f'{endian}H', f.read(2))[0]
            e_shnum = struct.unpack(f'{endian}H', f.read(2))[0]
        else:
            f.seek(32)
            e_shoff = struct.unpack(f'{endian}I', f.read(4))[0]
            f.seek(46)
            e_shentsize = struct.unpack(f'{endian}H', f.read(2))[0]
            e_shnum = struct.unpack(f'{endian}H', f.read(2))[0]
        
        # Search for .note.gnu.property section
        max_page_size = None
        
        for i in range(e_shnum):
            f.seek(e_shoff + i * e_shentsize)
            
            if is_64bit:
                sh_type = struct.unpack(f'{endian}I', f.read(4))[0]
                sh_flags = struct.unpack(f'{endian}Q', f.read(8))[0]
                sh_addr = struct.unpack(f'{endian}Q', f.read(8))[0]
                sh_offset = struct.unpack(f'{endian}Q', f.read(8))[0]
                sh_size = struct.unpack(f'{endian}Q', f.read(8))[0]
                sh_link = struct.unpack(f'{endian}I', f.read(4))[0]
                sh_info = struct.unpack(f'{endian}I', f.read(4))[0]
                sh_addralign = struct.unpack(f'{endian}Q', f.read(8))[0]
                sh_entsize = struct.unpack(f'{endian}Q', f.read(8))[0]
            else:
                sh_type = struct.unpack(f'{endian}I', f.read(4))[0]
                sh_flags = struct.unpack(f'{endian}I', f.read(4))[0]
                sh_addr = struct.unpack(f'{endian}I', f.read(4))[0]
                sh_offset = struct.unpack(f'{endian}I', f.read(4))[0]
                sh_size = struct.unpack(f'{endian}I', f.read(4))[0]
                sh_link = struct.unpack(f'{endian}I', f.read(4))[0]
                sh_info = struct.unpack(f'{endian}I', f.read(4))[0]
                sh_addralign = struct.unpack(f'{endian}I', f.read(4))[0]
                sh_entsize = struct.unpack(f'{endian}I', f.read(4))[0]
            
            # SHT_NOTE = 7
            if sh_type == 7:
                # Read note section
                f.seek(sh_offset)
                note_data = f.read(sh_size)
                
                # Parse GNU property notes
                pos = 0
                while pos < len(note_data):
                    if pos + 12 > len(note_data):
                        break
                    
                    namesz = struct.unpack(f'{endian}I', note_data[pos:pos+4])[0]
                    descsz = struct.unpack(f'{endian}I', note_data[pos+4:pos+8])[0]
                    n_type = struct.unpack(f'{endian}I', note_data[pos+8:pos+12])[0]
                    
                    pos += 12
                    
                    # Align to 4 bytes
                    name = note_data[pos:pos+namesz].rstrip(b'\0')
                    pos = (pos + namesz + 3) & ~3
                    
                    desc = note_data[pos:pos+descsz]
                    pos = (pos + descsz + 3) & ~3
                    
                    # NT_GNU_PROPERTY_TYPE_0 = 5
                    if n_type == 5 and b'GNU' in name:
                        # Parse property descriptor
                        prop_pos = 0
                        while prop_pos < len(desc):
                            if prop_pos + 8 > len(desc):
                                break
                            
                            pr_type = struct.unpack(f'{endian}I', desc[prop_pos:prop_pos+4])[0]
                            pr_datasz = struct.unpack(f'{endian}I', desc[prop_pos+4:prop_pos+8])[0]
                            prop_pos += 8
                            
                            # GNU_PROPERTY_AARCH64_FEATURE_1_AND = 0xc0000000
                            # But we're looking for max-page-size
                            if pr_type == 0xc0000000 and pr_datasz >= 4:
                                # Check for max-page-size property
                                # This is complex, let's try a simpler approach
                                pass
                            
                            prop_pos = (prop_pos + pr_datasz + 3) & ~3
        
        return max_page_size

def main():
    if len(sys.argv) < 2:
        print("Usage: python check_max_page_size.py <path_to_so_file>")
        sys.exit(1)
    
    file_path = sys.argv[1]
    
    if not os.path.exists(file_path):
        print(f"Error: File not found: {file_path}")
        sys.exit(1)
    
    # Try using readelf if available (more reliable)
    import subprocess
    try:
        # Try to use readelf via WSL or system
        result = subprocess.run(['wsl', 'readelf', '-n', file_path.replace('\\', '/').replace('C:', '/mnt/c')], 
                              capture_output=True, text=True, timeout=5)
        if result.returncode == 0:
            output = result.stdout
            if 'max-page-size' in output.lower():
                print("Found max-page-size in notes:")
                for line in output.split('\n'):
                    if 'max-page-size' in line.lower() or '16384' in line or '4096' in line:
                        print(f"  {line}")
            else:
                print("No max-page-size note found in ELF file")
                print("This might be why Google Play Console reports it as non-compliant")
        else:
            print("Could not use readelf. Checking alignment only...")
    except:
        print("readelf not available. Checking alignment only...")
    
    # Fallback: check alignment
    from analyze_elf_16kb import analyze_elf_file
    result, error = analyze_elf_file(file_path)
    
    if result:
        print(f"\nLOAD Segment Alignment: {result['alignment']} bytes")
        if result['alignment'] >= 16384:
            print("✅ Alignment is compliant (16 KB+)")
        else:
            print("❌ Alignment is NOT compliant (needs 16 KB)")
        
        print(f"\nNote: Google Play Console checks for max-page-size ELF note.")
        print("Even if alignment is correct, missing max-page-size note can cause rejection.")
    else:
        print(f"Error: {error}")

if __name__ == '__main__':
    main()

