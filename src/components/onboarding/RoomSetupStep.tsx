"use client";

import { useState, useEffect } from "react";
import { Loader2, Plus, Trash, Info } from "lucide-react";

interface RoomTypeConfig {
  name: string;
  code: string;
  capacity: number;
  beds: number;
  basePrice: number;
}

interface RoomConfig {
  number: string;
  floorNumber: number;
  roomTypeCode: string;
}

interface RoomSetupStepProps {
  onComplete: (data: {
    floors: number[];
    roomTypes: RoomTypeConfig[];
    rooms: RoomConfig[];
  }) => void;
  isLoading: boolean;
  error: string | null;
}

const PRESET_CATEGORIES = [
  { name: "Deluxe Room", code: "DLX", price: 4000, capacity: 2, beds: 1 },
  { name: "Standard Room", code: "STD", price: 2500, capacity: 2, beds: 1 },
  { name: "Executive Suite", code: "EXE", price: 7500, capacity: 4, beds: 2 },
  { name: "Presidential Suite", code: "PRS", price: 15000, capacity: 4, beds: 2 },
  { name: "Family Villa / Suite", code: "FAM", price: 9000, capacity: 6, beds: 3 },
  { name: "Penthouse Suite", code: "PNT", price: 20000, capacity: 4, beds: 2 },
  { name: "Single Economy Room", code: "SGL", price: 1800, capacity: 1, beds: 1 },
  { name: "Twin Deluxe Room", code: "TWN", price: 4500, capacity: 2, beds: 2 },
  { name: "Honeymoon Ocean Suite", code: "HNM", price: 12000, capacity: 2, beds: 1 },
  { name: "Accessible Room", code: "ACC", price: 3000, capacity: 2, beds: 1 },
];

export default function RoomSetupStep({ onComplete, isLoading, error }: RoomSetupStepProps) {
  const [floorsCount, setFloorsCount] = useState(3);
  const [floorRooms, setFloorRooms] = useState<number[]>([15, 15, 15]);
  
  const [roomTypes, setRoomTypes] = useState<RoomTypeConfig[]>([
    { name: "Standard Room", code: "STD", capacity: 2, beds: 1, basePrice: 2000 },
    { name: "Deluxe Room", code: "DLX", capacity: 2, beds: 1, basePrice: 3500 },
    { name: "Executive Suite", code: "SUI", capacity: 4, beds: 2, basePrice: 7000 },
  ]);

  const [generatedRooms, setGeneratedRooms] = useState<RoomConfig[]>([]);

  // Keep floorRooms array in sync with floorsCount
  useEffect(() => {
    setFloorRooms((prev) => {
      const next = [...prev];
      if (next.length < floorsCount) {
        const lastCount = next[next.length - 1] || 15;
        while (next.length < floorsCount) {
          next.push(lastCount);
        }
      } else if (next.length > floorsCount) {
        next.splice(floorsCount);
      }
      return next;
    });
  }, [floorsCount]);

  // Automatically generate rooms based on floorsCount, floorRooms, and first room type
  useEffect(() => {
    if (floorRooms.length !== floorsCount) return;

    const rooms: RoomConfig[] = [];
    const defaultType = roomTypes[0]?.code || "STD";

    for (let f = 1; f <= floorsCount; f++) {
      const countForFloor = floorRooms[f - 1] || 15;
      for (let r = 1; r <= countForFloor; r++) {
        // e.g. 101, 102 for Floor 1; 201, 202 for Floor 2
        const roomNumber = `${f}${String(r).padStart(2, "0")}`;
        rooms.push({
          number: roomNumber,
          floorNumber: f,
          roomTypeCode: defaultType,
        });
      }
    }
    setGeneratedRooms(rooms);
  }, [floorsCount, floorRooms]);

  const handleRoomTypeChange = (index: number, field: keyof RoomTypeConfig, value: any) => {
    const updated = [...roomTypes];
    updated[index] = { ...updated[index], [field]: value };
    setRoomTypes(updated);
  };

  const handleAddRoomType = () => {
    setRoomTypes([
      ...roomTypes,
      { name: "New Type", code: `TYP${roomTypes.length + 1}`, capacity: 2, beds: 1, basePrice: 3000 },
    ]);
  };

  const handleRemoveRoomType = (index: number) => {
    if (roomTypes.length > 1) {
      const removedCode = roomTypes[index].code;
      const updated = roomTypes.filter((_, i) => i !== index);
      setRoomTypes(updated);

      // Reassign rooms using the removed type to the first available type
      const firstCode = updated[0].code;
      setGeneratedRooms(
        generatedRooms.map((r) =>
          r.roomTypeCode === removedCode ? { ...r, roomTypeCode: firstCode } : r
        )
      );
    }
  };

  const handleRoomTypeSelect = (roomIndex: number, code: string) => {
    const updated = [...generatedRooms];
    updated[roomIndex] = { ...updated[roomIndex], roomTypeCode: code };
    setGeneratedRooms(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (generatedRooms.length > 0) {
      const floorsArray = Array.from({ length: floorsCount }, (_, i) => i + 1);
      onComplete({
        floors: floorsArray,
        roomTypes,
        rooms: generatedRooms,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center sm:text-left">
        <h2 className="text-2xl font-bold tracking-tight text-text-primary">
          Configure Floors and Rooms
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Customize your hotel structure, rate pricing plans, and individual rooms.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2 max-w-xs">
          <label htmlFor="floorsCount" className="block text-sm font-semibold text-text-secondary">
            Number of Floors
          </label>
          <input
            id="floorsCount"
            type="number"
            min={1}
            max={20}
            value={floorsCount}
            onChange={(e) => setFloorsCount(Math.max(1, parseInt(e.target.value) || 1))}
            disabled={isLoading}
            className="w-full px-4 py-2 border border-border-default rounded-md bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50 transition-all"
          />
        </div>

        {/* Dynamic floor room count overrides */}
        <div className="p-4 border border-border-default rounded-md bg-surface-secondary space-y-3">
          <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
            Rooms count per Floor
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {floorRooms.map((count, idx) => (
              <div key={idx} className="space-y-1">
                <label className="text-xs font-semibold text-text-secondary">
                  Floor {idx + 1}
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={count}
                  onChange={(e) => {
                    const updated = [...floorRooms];
                    updated[idx] = Math.max(1, parseInt(e.target.value) || 1);
                    setFloorRooms(updated);
                  }}
                  disabled={isLoading}
                  className="w-full px-3 py-1.5 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none focus:border-primary"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Room Types configuration */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-base font-semibold text-text-primary">Room Types & Prices</h3>
          <button
            type="button"
            onClick={handleAddRoomType}
            disabled={isLoading}
            className="flex items-center text-xs font-semibold text-primary hover:text-primary-hover disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Type
          </button>
        </div>

        <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
          {roomTypes.map((rt, idx) => (
            <div
              key={idx}
              className="p-4 border border-border-default rounded-md bg-surface-secondary grid grid-cols-12 gap-3 items-end relative group"
            >
              {/* Name & Preset Select (span 4/12) */}
              <div className="col-span-12 sm:col-span-4 space-y-1">
                <label className="text-xs text-text-secondary font-semibold">Category Preset & Name</label>
                <select
                  value={PRESET_CATEGORIES.some((p) => p.name === rt.name) ? rt.name : "CUSTOM"}
                  onChange={(e) => {
                    const val = e.target.value;
                    const preset = PRESET_CATEGORIES.find((p) => p.name === val);
                    if (preset && val !== "CUSTOM") {
                      handleRoomTypeChange(idx, "name", preset.name);
                      handleRoomTypeChange(idx, "code", preset.code);
                      handleRoomTypeChange(idx, "basePrice", preset.price);
                      handleRoomTypeChange(idx, "capacity", preset.capacity);
                    }
                  }}
                  disabled={isLoading}
                  className="w-full px-2 py-1 border border-border-default rounded bg-surface text-xs font-semibold text-text-primary focus:outline-none mb-1"
                >
                  <option value="">-- Choose Category --</option>
                  {PRESET_CATEGORIES.map((cat) => (
                    <option key={cat.code} value={cat.name}>
                      🛏️ {cat.name} ({cat.code})
                    </option>
                  ))}
                  <option value="CUSTOM">➕ + Custom Name...</option>
                </select>
                <input
                  type="text"
                  value={rt.name}
                  onChange={(e) => handleRoomTypeChange(idx, "name", e.target.value)}
                  placeholder="Category Name"
                  required
                  disabled={isLoading}
                  className="w-full px-3 py-1.5 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none focus:border-primary font-medium"
                />
              </div>
              
              {/* Code (span 2/12) */}
              <div className="col-span-12 sm:col-span-2 space-y-1">
                <label className="text-xs text-text-secondary font-semibold">Code (Auto)</label>
                <input
                  type="text"
                  value={rt.code}
                  maxLength={5}
                  onChange={(e) => handleRoomTypeChange(idx, "code", e.target.value.toUpperCase())}
                  placeholder="Code"
                  required
                  disabled={isLoading}
                  className="w-full px-2.5 py-1.5 border border-border-default rounded bg-surface text-sm text-text-primary font-bold font-mono focus:outline-none focus:border-primary"
                />
              </div>

              {/* Price (span 3/12) */}
              <div className="col-span-12 sm:col-span-3 space-y-1">
                <label className="text-xs text-text-secondary font-semibold">Base Price (INR)</label>
                <input
                  type="number"
                  min={0}
                  value={rt.basePrice}
                  onChange={(e) => handleRoomTypeChange(idx, "basePrice", parseFloat(e.target.value) || 0)}
                  placeholder="Price"
                  required
                  disabled={isLoading}
                  className="w-full px-3 py-1.5 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none focus:border-primary"
                />
              </div>

              {/* Max Guest capacity & Action (span 3/12) */}
              <div className="col-span-12 sm:col-span-3 flex items-center space-x-2">
                <div className="flex-1 space-y-1">
                  <label className="text-xs text-text-secondary font-semibold">Max Guest</label>
                  <input
                    type="number"
                    min={1}
                    value={rt.capacity}
                    onChange={(e) => handleRoomTypeChange(idx, "capacity", parseInt(e.target.value) || 1)}
                    required
                    disabled={isLoading}
                    className="w-full px-2.5 py-1.5 border border-border-default rounded bg-surface text-sm text-text-primary focus:outline-none focus:border-primary"
                  />
                </div>
                {roomTypes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveRoomType(idx)}
                    disabled={isLoading}
                    className="p-2 text-text-muted hover:text-error hover:bg-error/10 rounded transition-all mb-0.5"
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Generated Rooms Grid */}
      <div className="space-y-3">
        <h3 className="text-base font-semibold text-text-primary flex items-center">
          Rooms Preview
          <span className="ml-2 text-xs font-normal text-text-secondary">
            ({generatedRooms.length} rooms generated automatically)
          </span>
        </h3>

        <div className="p-4 border border-border-default rounded-md bg-surface-secondary max-h-52 overflow-y-auto grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-6">
          {generatedRooms.map((r, idx) => (
            <div
              key={idx}
              className="p-2 border border-border-default rounded bg-surface flex flex-col justify-between items-center text-center space-y-1.5"
            >
              <span className="text-sm font-bold text-text-primary">{r.number}</span>
              <select
                value={r.roomTypeCode}
                onChange={(e) => handleRoomTypeSelect(idx, e.target.value)}
                disabled={isLoading}
                className="text-xs px-1 py-0.5 border border-border-default rounded bg-surface text-text-secondary focus:outline-none"
              >
                {roomTypes.map((rt) => (
                  <option key={rt.code} value={rt.code}>
                    {rt.code}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      <div className="p-3 bg-info/10 border border-info/20 rounded-md text-info text-xs flex items-start space-x-2">
        <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <span>
          Clicking "Complete Setup" will create these {generatedRooms.length} rooms, {roomTypes.length} room types, and {floorsCount} floors inside the database under a secure database transaction.
        </span>
      </div>

      {error && (
        <div className="p-3 bg-error/10 border border-error/20 rounded-md text-error text-sm font-medium">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading || generatedRooms.length === 0}
        className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-md shadow-medium text-sm font-semibold text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Generating Database Records...
          </>
        ) : (
          "Complete Setup"
        )}
      </button>
    </form>
  );
}
