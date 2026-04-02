#!/usr/bin/env python3
"""
Analyze ELF files for 16 KB page size compliance.
Checks LOAD segment alignment and max-page-size.
"""

import sys
import os
import struct
from pathlib import Path

def read_elf_header(file_path):
    """Read ELF header and determine endianness and class."""
    with open(file_path, 'rb') as f:
        # Read ELF magic
        magic = f.read(4)
        if magic != b'\x7fELF':
            return None, None, None
        
        # Read EI_CLASS (32-bit or 64-bit)
        f.seek(4)
        ei_class = struct.unpack('B', f.read(1))[0]
        
        # Read EI_DATA (endianness)
        ei_data = struct.unpack('B', f.read(1))[0]
        
        endian = '<' if ei_data == 1 else '>'
        is_64bit = ei_class == 2
        
        # Read e_phoff (program header table offset)
        if is_64bit:
            f.seek(32)
            e_phoff = struct.unpack(f'{endian}Q', f.read(8))[0]
            f.seek(54)
            e_phentsize = struct.unpack(f'{endian}H', f.read(2))[0]
            e_phnum = struct.unpack(f'{endian}H', f.read(2))[0]
        else:
            f.seek(28)
            e_phoff = struct.unpack(f'{endian}I', f.read(4))[0]
            f.seek(42)
            e_phentsize = struct.unpack(f'{endian}H', f.read(2))[0]
            e_phnum = struct.unpack(f'{endian}H', f.read(2))[0]
        
        return endian, is_64bit, (e_phoff, e_phentsize, e_phnum)

def read_program_headers(file_path, endian, is_64bit, ph_info):
    """Read program headers and find LOAD segments."""
    e_phoff, e_phentsize, e_phnum = ph_info
    
    load_segments = []
    
    with open(file_path, 'rb') as f:
        f.seek(e_phoff)
        
        for i in range(e_phnum):
            if is_64bit:
                # ELF64_Phdr structure
                p_type = struct.unpack(f'{endian}I', f.read(4))[0]
                p_flags = struct.unpack(f'{endian}I', f.read(4))[0]
                p_offset = struct.unpack(f'{endian}Q', f.read(8))[0]
                p_vaddr = struct.unpack(f'{endian}Q', f.read(8))[0]
                p_paddr = struct.unpack(f'{endian}Q', f.read(8))[0]
                p_filesz = struct.unpack(f'{endian}Q', f.read(8))[0]
                p_memsz = struct.unpack(f'{endian}Q', f.read(8))[0]
                p_align = struct.unpack(f'{endian}Q', f.read(8))[0]
            else:
                # ELF32_Phdr structure
                p_type = struct.unpack(f'{endian}I', f.read(4))[0]
                p_offset = struct.unpack(f'{endian}I', f.read(4))[0]
                p_vaddr = struct.unpack(f'{endian}I', f.read(4))[0]
                p_paddr = struct.unpack(f'{endian}I', f.read(4))[0]
                p_filesz = struct.unpack(f'{endian}I', f.read(4))[0]
                p_memsz = struct.unpack(f'{endian}I', f.read(4))[0]
                p_flags = struct.unpack(f'{endian}I', f.read(4))[0]
                p_align = struct.unpack(f'{endian}I', f.read(4))[0]
            
            # PT_LOAD = 1
            if p_type == 1:
                load_segments.append({
                    'align': p_align,
                    'vaddr': p_vaddr,
                    'offset': p_offset,
                    'flags': p_flags
                })
    
    return load_segments

def check_note_section(file_path):
    """Check for max-page-size in note sections."""
    # This is a simplified check - full implementation would parse all note sections
    # For now, we'll rely on LOAD segment alignment
    return None

def analyze_elf_file(file_path):
    """Analyze an ELF file for 16 KB compliance."""
    try:
        endian, is_64bit, ph_info = read_elf_header(file_path)
        if not endian:
            return None, "Not a valid ELF file"
        
        load_segments = read_program_headers(file_path, endian, is_64bit, ph_info)
        
        if not load_segments:
            return None, "No LOAD segments found"
        
        # Get the maximum alignment from all LOAD segments
        max_align = max(seg['align'] for seg in load_segments)
        
        # Check if alignment is 16 KB or higher
        is_compliant = max_align >= 16384
        
        return {
            'alignment': max_align,
            'compliant': is_compliant,
            'load_segments': len(load_segments),
            'segments': load_segments
        }, None
        
    except Exception as e:
        return None, str(e)

def main():
    if len(sys.argv) < 2:
        print("Usage: python analyze_elf_16kb.py <path_to_so_file>")
        sys.exit(1)
    
    file_path = sys.argv[1]
    
    if not os.path.exists(file_path):
        print(f"Error: File not found: {file_path}")
        sys.exit(1)
    
    result, error = analyze_elf_file(file_path)
    
    if error:
        print(f"Error: {error}")
        sys.exit(1)
    
    print(f"File: {os.path.basename(file_path)}")
    print(f"Alignment: {result['alignment']} bytes ({result['alignment']/1024:.2f} KB)")
    print(f"LOAD segments: {result['load_segments']}")
    
    # Use ASCII-safe status messages for Windows console compatibility
    if result['compliant']:
        print("Status: COMPLIANT (16 KB+)")
        sys.exit(0)
    else:
        print("Status: NON-COMPLIANT (needs 16 KB alignment)")
        sys.exit(1)

if __name__ == '__main__':
    main()

